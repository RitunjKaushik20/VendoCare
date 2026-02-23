
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../core/middlewares/auth');
const { authorize } = require('../core/middlewares/role');
const { ok, created, badRequest, notFound } = require('../core/utils/response');
const { paginate, generateInvoiceNumber, calculateGST } = require('../core/utils/helpers');
const { emitToCompany, emitToVendor } = require('../config/socket');
const logger = require('../core/utils/logger');

const router = express.Router();
const { prisma } = require('../config/database');


const invoiceValidation = [
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('description').optional().trim(),
  body('gstRate').optional().isFloat({ min: 0, max: 28 }).withMessage('GST rate must be between 0 and 28'),
  body('contractId').optional().isUUID().withMessage('Invalid contract ID'),
];


router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vendorId, startDate, endDate } = req.query;

    const where = {
      companyId: req.user.companyId,
      ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
      ...(status && { status }),
      ...(vendorId && { vendorId }),
      ...(startDate && endDate && {
        issueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true, email: true },
          },
          contract: {
            select: { id: true, title: true },
          },
          payment: {
            select: { id: true, status: true, amount: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return ok(res, {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take),
      },
    }, 'Invoices retrieved');
  } catch (error) {
    logger.error('Get invoices error:', error);
    return badRequest(res, 'Failed to get invoices');
  }
});


router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true, gstNumber: true },
        },
        contract: {
          select: { id: true, title: true, amount: true },
        },
        company: {
          select: { id: true, name: true, gstNumber: true, panNumber: true },
        },
        payment: true,
      },
    });

    if (!invoice) {
      return notFound(res, 'Invoice not found');
    }

    return ok(res, invoice, 'Invoice retrieved');
  } catch (error) {
    logger.error('Get invoice error:', error);
    return badRequest(res, 'Failed to get invoice');
  }
});


router.post('/', authenticate, authorize('invoices:create'), invoiceValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: req.body.vendorId,
        companyId: req.user.companyId,
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    
    const gstRate = req.body.gstRate || 18;
    const gstCalculated = calculateGST(req.body.amount, gstRate);

    
    const invoiceNumber = await generateInvoiceNumber(prisma, req.user.companyId);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        amount: req.body.amount,
        gstRate,
        gstAmount: gstCalculated.gstAmount,
        totalAmount: gstCalculated.totalAmount,
        description: req.body.description,
        dueDate: req.body.dueDate,
        contractId: req.body.contractId,
        companyId: req.user.companyId,
        vendorId: req.body.vendorId,
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    
    emitToVendor(req.body.vendorId, 'invoice_created', invoice);
    emitToCompany(req.user.companyId, 'invoice_created', invoice);

    logger.info(`New invoice created: ${invoiceNumber} by ${req.user.email}`);
    return created(res, invoice, 'Invoice created successfully');
  } catch (error) {
    logger.error('Create invoice error:', error);
    return badRequest(res, 'Failed to create invoice');
  }
});


router.put('/:id', authenticate, authorize('invoices:update'), async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!invoice) {
      return notFound(res, 'Invoice not found');
    }

    if (invoice.status === 'PAID') {
      return badRequest(res, 'Cannot update a paid invoice');
    }

    
    let updateData = { ...req.body };
    if (req.body.amount) {
      const gstRate = req.body.gstRate || invoice.gstRate;
      const gstCalculated = calculateGST(req.body.amount, gstRate);
      updateData.gstAmount = gstCalculated.gstAmount;
      updateData.totalAmount = gstCalculated.totalAmount;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Invoice updated: ${updatedInvoice.invoiceNumber} by ${req.user.email}`);

    
    emitToVendor(invoice.vendorId, 'invoice:status-changed', updatedInvoice);
    emitToCompany(req.user.companyId, 'invoice:status-changed', updatedInvoice);

    return ok(res, updatedInvoice, 'Invoice updated successfully');
  } catch (error) {
    logger.error('Update invoice error:', error);
    return badRequest(res, 'Failed to update invoice');
  }
});


router.delete('/:id', authenticate, authorize('invoices:delete'), async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!invoice) {
      return notFound(res, 'Invoice not found');
    }

    if (invoice.status === 'PAID') {
      return badRequest(res, 'Cannot delete a paid invoice');
    }

    await prisma.invoice.delete({ where: { id: req.params.id } });

    logger.info(`Invoice deleted: ${invoice.invoiceNumber} by ${req.user.email}`);
    return ok(res, null, 'Invoice deleted successfully');
  } catch (error) {
    logger.error('Delete invoice error:', error);
    return badRequest(res, 'Failed to delete invoice');
  }
});


router.get('/alerts/overdue', authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return ok(res, invoices, 'Overdue invoices retrieved');
  } catch (error) {
    logger.error('Get overdue invoices error:', error);
    return badRequest(res, 'Failed to get overdue invoices');
  }
});


router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const vendorFilter = req.user.role === 'VENDOR' ? { vendorId: req.vendorId } : {};

    const [pending, paid, overdue, totalAmount] = await Promise.all([
      prisma.invoice.count({ where: { companyId: req.user.companyId, status: 'PENDING', ...vendorFilter } }),
      prisma.invoice.count({ where: { companyId: req.user.companyId, status: 'PAID', ...vendorFilter } }),
      prisma.invoice.count({
        where: {
          companyId: req.user.companyId,
          status: 'PENDING',
          dueDate: { lt: new Date() },
          ...vendorFilter
        },
      }),
      prisma.invoice.aggregate({
        where: { companyId: req.user.companyId, ...vendorFilter },
        _sum: { totalAmount: true },
      }),
    ]);

    return ok(res, {
      pending,
      paid,
      overdue,
      totalAmount: totalAmount._sum.totalAmount || 0,
    }, 'Invoice statistics retrieved');
  } catch (error) {
    logger.error('Get invoice stats error:', error);
    return badRequest(res, 'Failed to get invoice statistics');
  }
});

module.exports = router;
