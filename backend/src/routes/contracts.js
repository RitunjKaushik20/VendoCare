
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../core/middlewares/auth');
const { authorize } = require('../core/middlewares/role');
const { ok, created, badRequest, notFound } = require('../core/utils/response');
const { paginate } = require('../core/utils/helpers');
const { emitToCompany, emitToVendor } = require('../config/socket');
const logger = require('../core/utils/logger');

const router = express.Router();
const { prisma } = require('../config/database');


const contractValidation = [
  body('title').trim().notEmpty().withMessage('Contract title is required'),
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('paymentCycle').isIn(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME']).withMessage('Invalid payment cycle'),
  body('description').optional().trim(),
  body('terms').optional().trim(),
];


router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vendorId, search } = req.query;

    const where = {
      companyId: req.user.companyId,
      ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
      ...(status && { status }),
      ...(vendorId && { vendorId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true, email: true },
          },
          company: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return ok(res, {
      contracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take),
      },
    }, 'Contracts retrieved');
  } catch (error) {
    logger.error('Get contracts error:', error);
    return badRequest(res, 'Failed to get contracts');
  }
});


router.get('/my', authenticate, authorize('VENDOR'), async (req, res) => {
  try {
    if (!req.vendorId) {
      if (req.user && req.user.role === 'VENDOR') {
        const { prisma } = require('../config/database');
        const vendor = await prisma.vendor.findFirst({
          where: {
            OR: [
              { userId: req.user.id },
              { createdById: req.user.id }
            ]
          }
        });
        if (vendor) {
          req.vendorId = vendor.id;
        } else {
          return notFound(res, 'No vendor profile found for this user');
        }
      } else {
        return notFound(res, 'No vendor profile found for this user');
      }
    }

    const contracts = await prisma.contract.findMany({
      where: {
        vendorId: req.vendorId,
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log("FETCHED CONTRACTS", req.vendorId, contracts.length);
    return ok(res, { contracts }, 'Vendor contracts retrieved');
  } catch (error) {
    logger.error('Get my contracts error:', error);
    return badRequest(res, 'Failed to get vendor contracts');
  }
});


router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true },
        },
        company: {
          select: { id: true, name: true },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, amount: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      return notFound(res, 'Contract not found');
    }

    return ok(res, contract, 'Contract retrieved');
  } catch (error) {
    logger.error('Get contract error:', error);
    return badRequest(res, 'Failed to get contract');
  }
});


router.post('/', authenticate, authorize('contracts:create'), contractValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: req.body.vendorId,
        companyId: req.vendorCompanyId || req.user.companyId,
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    const contract = await prisma.contract.create({
      data: {
        ...req.body,
        companyId: req.user.companyId,
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    
    emitToVendor(req.body.vendorId, 'contract_created', contract);
    emitToCompany(req.user.companyId, 'contract_created', contract);

    logger.info(`New contract created: ${contract.title} by ${req.user.email}`);
    return created(res, contract, 'Contract created successfully');
  } catch (error) {
    logger.error('Create contract error:', error);
    return badRequest(res, 'Failed to create contract');
  }
});


router.put('/:id', authenticate, authorize('contracts:update'), async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
      },
    });

    if (!contract) {
      return notFound(res, 'Contract not found');
    }

    const updatedContract = await prisma.contract.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Contract updated: ${updatedContract.title} by ${req.user.email}`);
    return ok(res, updatedContract, 'Contract updated successfully');
  } catch (error) {
    logger.error('Update contract error:', error);
    return badRequest(res, 'Failed to update contract');
  }
});


router.put('/:id/terminate', authenticate, authorize('contracts:update'), async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!contract) {
      return notFound(res, 'Contract not found');
    }

    const updatedContract = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        status: 'TERMINATED',
        endDate: new Date(),
      },
    });

    logger.info(`Contract terminated: ${contract.title} by ${req.user.email}`);
    return ok(res, updatedContract, 'Contract terminated successfully');
  } catch (error) {
    logger.error('Terminate contract error:', error);
    return badRequest(res, 'Failed to terminate contract');
  }
});


router.delete('/:id', authenticate, authorize('contracts:delete'), async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!contract) {
      return notFound(res, 'Contract not found');
    }

    await prisma.contract.delete({ where: { id: req.params.id } });

    logger.info(`Contract deleted: ${contract.title} by ${req.user.email}`);
    return ok(res, null, 'Contract deleted successfully');
  } catch (error) {
    logger.error('Delete contract error:', error);
    return badRequest(res, 'Failed to delete contract');
  }
});


router.get('/alerts/expiring', authenticate, async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const contracts = await prisma.contract.findMany({
      where: {
        companyId: req.user.companyId,
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return ok(res, contracts, 'Expiring contracts retrieved');
  } catch (error) {
    logger.error('Get expiring contracts error:', error);
    return badRequest(res, 'Failed to get expiring contracts');
  }
});

module.exports = router;
