
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../core/middlewares/auth');
const { authorize } = require('../core/middlewares/role');
const { ok, created, badRequest, notFound } = require('../core/utils/response');
const { paginate, buildFilter } = require('../core/utils/helpers');
const { emitToCompany } = require('../config/socket');
const logger = require('../core/utils/logger');

const router = express.Router();
const { prisma } = require('../config/database');


const vendorValidation = [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('gstNumber').optional().trim(),
  body('panNumber').optional().trim(),
  body('bankName').optional().trim(),
  body('bankAccount').optional().trim(),
  body('ifscCode').optional().trim(),
];


router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where = {
      companyId: req.user.companyId,
      ...(req.user.role === 'VENDOR' && { id: req.vendorId }),
      ...(status && { status }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          category: true,
          rating: true,
          totalSpent: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return ok(res, {
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take),
      },
    }, 'Vendors retrieved');
  } catch (error) {
    logger.error('Get vendors error:', error);
    return badRequest(res, 'Failed to get vendors');
  }
});


router.get('/:id', authenticate, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { id: req.vendorId }),
      },
      include: {
        contracts: {
          select: { id: true, title: true, amount: true, status: true },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, amount: true, status: true },
          take: 5,
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    return ok(res, vendor, 'Vendor retrieved');
  } catch (error) {
    logger.error('Get vendor error:', error);
    return badRequest(res, 'Failed to get vendor');
  }
});


router.post('/', authenticate, authorize('vendors:create'), vendorValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }


    let user = await prisma.user.findUnique({ where: { email: req.body.email } });

    const vendorData = {
      ...req.body,
      companyId: req.user.companyId,
      createdById: req.user.id,
    };

    if (user) {
      vendorData.userId = user.id;
    }

    const vendor = await prisma.vendor.create({
      data: vendorData,
      select: {
        id: true,
        name: true,
        email: true,
        category: true,
        status: true,
        createdAt: true,
      },
    });


    emitToCompany(req.user.companyId, 'vendor_created', vendor);

    logger.info(`New vendor created: ${vendor.name} by ${req.user.email}`);
    return created(res, vendor, 'Vendor created successfully');
  } catch (error) {
    if (error.code === 'P2002') {
      return badRequest(res, 'Email already exists');
    }
    logger.error('Create vendor error:', error);
    return badRequest(res, 'Failed to create vendor');
  }
});


router.put('/:id', authenticate, authorize('vendors:update'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: req.body,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        category: true,
        status: true,
        rating: true,
        totalSpent: true,
        updatedAt: true,
      },
    });

    logger.info(`Vendor updated: ${updatedVendor.name} by ${req.user.email}`);
    return ok(res, updatedVendor, 'Vendor updated successfully');
  } catch (error) {
    logger.error('Update vendor error:', error);
    return badRequest(res, 'Failed to update vendor');
  }
});


router.delete('/:id', authenticate, authorize('vendors:delete'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { vendorId: req.params.id } });
      await tx.invoice.deleteMany({ where: { vendorId: req.params.id } });

      const vendorContracts = await tx.contract.findMany({
        where: { vendorId: req.params.id },
        select: { id: true }
      });
      const contractIds = vendorContracts.map(c => c.id);

      if (contractIds.length > 0) {
        await tx.contractDocument.deleteMany({ where: { contractId: { in: contractIds } } });
      }

      await tx.contract.deleteMany({ where: { vendorId: req.params.id } });
      await tx.vendorDocument.deleteMany({ where: { vendorId: req.params.id } });

      await tx.vendor.delete({ where: { id: req.params.id } });

      if (vendor.userId) {
        await tx.user.delete({ where: { id: vendor.userId } });
      }
    });

    logger.info(`Vendor deleted: ${vendor.name} by ${req.user.email}`);
    return ok(res, null, 'Vendor deleted successfully');
  } catch (error) {
    logger.error('Delete vendor error:', error);
    return badRequest(res, 'Failed to delete vendor');
  }
});


router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { id: req.vendorId }),
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    const [contractCount, invoiceCount, totalPaid, pendingAmount] = await Promise.all([
      prisma.contract.count({ where: { vendorId: req.params.id } }),
      prisma.invoice.count({ where: { vendorId: req.params.id } }),
      prisma.payment.aggregate({
        where: { vendorId: req.params.id, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { vendorId: req.params.id, status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
    ]);

    return ok(res, {
      contractCount,
      invoiceCount,
      totalPaid: totalPaid._sum.amount || 0,
      pendingAmount: pendingAmount._sum.totalAmount || 0,
    }, 'Vendor statistics retrieved');
  } catch (error) {
    logger.error('Get vendor stats error:', error);
    return badRequest(res, 'Failed to get vendor statistics');
  }
});

module.exports = router;
