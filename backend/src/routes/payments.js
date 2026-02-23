
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../core/middlewares/auth');
const { authorize } = require('../core/middlewares/role');
const { ok, created, badRequest, notFound } = require('../core/utils/response');
const { paginate } = require('../core/utils/helpers');
const { emitPaymentCompleted } = require('../config/socket');
const logger = require('../core/utils/logger');

const router = express.Router();
const { prisma } = require('../config/database');


const paymentValidation = [
  body('invoiceId').isUUID().withMessage('Valid invoice ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['BANK_TRANSFER', 'UPI', 'CHECK', 'CASH', 'CARD', 'WALLET']).withMessage('Invalid payment method'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  body('transactionId').optional().trim(),
  body('notes').optional().trim(),
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
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true, email: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, totalAmount: true },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return ok(res, {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take),
      },
    }, 'Payments retrieved');
  } catch (error) {
    logger.error('Get payments error:', error);
    return badRequest(res, 'Failed to get payments');
  }
});


router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        ...(req.user.role === 'VENDOR' && { vendorId: req.vendorId }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true, bankName: true, bankAccount: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, amount: true, gstAmount: true, totalAmount: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!payment) {
      return notFound(res, 'Payment not found');
    }

    return ok(res, payment, 'Payment retrieved');
  } catch (error) {
    logger.error('Get payment error:', error);
    return badRequest(res, 'Failed to get payment');
  }
});


router.post('/', authenticate, authorize('payments:create'), paymentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.body.invoiceId,
        companyId: req.user.companyId,
      },
    });

    if (!invoice) {
      return notFound(res, 'Invoice not found');
    }

    if (invoice.status === 'PAID') {
      return badRequest(res, 'Invoice is already paid');
    }

    
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: invoice.vendorId,
        companyId: req.user.companyId,
      },
    });

    if (!vendor) {
      return notFound(res, 'Vendor not found');
    }

    
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          amount: req.body.amount,
          currency: req.body.currency || 'INR',
          transactionId: req.body.transactionId || `TXN-${Date.now()}`,
          method: req.body.method,
          status: 'COMPLETED',
          paymentDate: new Date(req.body.paymentDate),
          notes: req.body.notes,
          companyId: req.user.companyId,
          vendorId: invoice.vendorId,
          invoiceId: req.body.invoiceId,
        },
        include: {
          vendor: {
            select: { id: true, name: true, email: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
        },
      });

      
      await tx.invoice.update({
        where: { id: req.body.invoiceId },
        data: {
          status: 'PAID',
          paidDate: new Date(),
        },
      });

      
      await tx.vendor.update({
        where: { id: invoice.vendorId },
        data: {
          totalSpent: { increment: req.body.amount },
        },
      });

      return newPayment;
    });

    
    emitPaymentCompleted({
      vendorId: invoice.vendorId,
      paymentId: payment.id,
      invoiceNumber: payment.invoice.invoiceNumber,
      amount: req.body.amount,
      transactionId: payment.transactionId,
    });

    logger.info(`Payment created: ${payment.transactionId} by ${req.user.email}`);
    return created(res, payment, 'Payment recorded successfully');
  } catch (error) {
    logger.error('Create payment error:', error);
    return badRequest(res, 'Failed to create payment');
  }
});


router.put('/:id', authenticate, authorize('payments:update'), async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!payment) {
      return notFound(res, 'Payment not found');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true },
        },
      },
    });

    logger.info(`Payment updated: ${updatedPayment.transactionId} by ${req.user.email}`);
    return ok(res, updatedPayment, 'Payment updated successfully');
  } catch (error) {
    logger.error('Update payment error:', error);
    return badRequest(res, 'Failed to update payment');
  }
});


router.post('/:id/refund', authenticate, authorize('payments:refund'), async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        status: 'COMPLETED',
      },
    });

    if (!payment) {
      return notFound(res, 'Payment not found or not eligible for refund');
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const refund = await tx.payment.update({
        where: { id: req.params.id },
        data: {
          status: 'REFUNDED',
        },
      });

      
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'PENDING',
          paidDate: null,
        },
      });

      
      await tx.vendor.update({
        where: { id: payment.vendorId },
        data: {
          totalSpent: { decrement: payment.amount },
        },
      });

      return refund;
    });

    logger.info(`Payment refunded: ${updatedPayment.transactionId} by ${req.user.email}`);
    return ok(res, updatedPayment, 'Payment refunded successfully');
  } catch (error) {
    logger.error('Refund payment error:', error);
    return badRequest(res, 'Failed to refund payment');
  }
});


router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const vendorFilter = req.user.role === 'VENDOR' ? { vendorId: req.vendorId } : {};

    const [pending, completed, failed, refunded, totalAmount] = await Promise.all([
      prisma.payment.count({ where: { companyId: req.user.companyId, status: 'PENDING', ...vendorFilter } }),
      prisma.payment.count({ where: { companyId: req.user.companyId, status: 'COMPLETED', ...vendorFilter } }),
      prisma.payment.count({ where: { companyId: req.user.companyId, status: 'FAILED', ...vendorFilter } }),
      prisma.payment.count({ where: { companyId: req.user.companyId, status: 'REFUNDED', ...vendorFilter } }),
      prisma.payment.aggregate({
        where: { companyId: req.user.companyId, status: 'COMPLETED', ...vendorFilter },
        _sum: { amount: true },
      }),
    ]);

    return ok(res, {
      pending,
      completed,
      failed,
      refunded,
      totalAmount: totalAmount._sum.amount || 0,
    }, 'Payment statistics retrieved');
  } catch (error) {
    logger.error('Get payment stats error:', error);
    return badRequest(res, 'Failed to get payment statistics');
  }
});

module.exports = router;
