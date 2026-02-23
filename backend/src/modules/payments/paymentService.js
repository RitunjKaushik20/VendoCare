
const { v4: uuidv4 } = require('uuid');
const razorpay = require('../../config/razorpay');
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class PaymentService {
  
  async getAll({ page = 1, limit = 10, search, status, vendorId, companyId }) {
    const where = {
      companyId,
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { transactionId: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  
  async getById(id, companyId) {
    const payment = await prisma.payment.findFirst({
      where: { id, companyId },
      include: {
        company: { select: { id: true, name: true } },
        vendor: true,
        invoice: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  
  async createRazorpayOrder(amount, currency = 'INR', options = {}) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), 
        currency,
        receipt: options.receipt || `RCPT-${Date.now()}`,
        notes: options.notes || {},
        payment_capture: 1, 
      });

      logger.info(`Razorpay order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error(`Razorpay order creation failed: ${error.message}`);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  
  verifyPaymentSignature(orderId, paymentId, signature) {
    const hmac = razorpay.key_secret + '|' + orderId;
    const expectedSignature = require('crypto')
      .createHmac('sha256', razorpay.key_secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    return signature === expectedSignature;
  }

  
  async capturePayment(paymentId, amount) {
    try {
      const capture = await razorpay.payments.capture(paymentId, Math.round(amount * 100));
      logger.info(`Payment captured: ${paymentId}`);
      return capture;
    } catch (error) {
      logger.error(`Payment capture failed: ${error.message}`);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  
  async create(data, companyId) {
    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        ...data,
        transactionId,
        companyId,
      },
    });

    logger.info(`Payment created: ${transactionId}`);
    return payment;
  }

  
  async delete(id, companyId) {
    const payment = await prisma.payment.findFirst({
      where: { id, companyId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    await prisma.payment.delete({
      where: { id },
    });

    logger.info(`Payment deleted: ${payment.transactionId}`);
    return true;
  }

  
  async processWithRazorpay(invoiceId, companyId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { vendor: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Invoice is already paid');
    }

    
    const razorpayOrder = await this.createRazorpayOrder(
      invoice.totalAmount,
      'INR',
      {
        receipt: `INV-${invoice.invoiceNumber}`,
        notes: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          vendorId: invoice.vendorId,
          companyId: companyId,
        },
      }
    );

    
    const payment = await prisma.payment.create({
      data: {
        amount: invoice.totalAmount,
        currency: 'INR',
        transactionId: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
        method: 'ONLINE',
        status: 'PENDING',
        paymentDate: new Date(),
        notes: `Payment for invoice ${invoice.invoiceNumber}`,
        companyId,
        vendorId: invoice.vendorId,
        invoiceId: invoice.id,
        razorpayOrderId: razorpayOrder.id,
      },
    });

    logger.info(`Payment initiated: ${payment.transactionId} with Razorpay order ${razorpayOrder.id}`);

    return {
      payment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    };
  }

  
  async verifyAndComplete(paymentId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }, companyId) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, companyId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    
    const isValid = this.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
      },
    });

    
    if (payment.invoiceId) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'PAID', paidDate: new Date() },
      });
    }

    logger.info(`Payment verified and completed: ${payment.transactionId}`);
    return updatedPayment;
  }

  
  async updateStatus(id, status, companyId) {
    const payment = await prisma.payment.findFirst({ where: { id, companyId } });
    if (!payment) {
      throw new Error('Payment not found');
    }

    const updateData = { status };
    if (status === 'COMPLETED') {
      updateData.paymentDate = new Date();
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    
    if (status === 'COMPLETED' && payment.invoiceId) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'PAID', paidDate: new Date() },
      });
    }

    logger.info(`Payment status updated: ${payment.transactionId} -> ${status}`);
    return updatedPayment;
  }

  
  async refund(id, { amount, reason }, companyId) {
    const payment = await prisma.payment.findFirst({
      where: { id, companyId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Only completed payments can be refunded');
    }

    if (payment.razorpayPaymentId) {
      try {
        
        await razorpay.refunds.create({
          payment_id: payment.razorpayPaymentId,
          amount: Math.round(amount * 100), 
          notes: { reason },
          speed: 'optimum',
        });
      } catch (error) {
        logger.error(`Razorpay refund failed: ${error.message}`);
        throw new Error(`Refund failed: ${error.message}`);
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED', notes: `${payment.notes || ''}\nRefund reason: ${reason}` },
    });

    
    if (payment.invoiceId) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'PENDING', paidDate: null },
      });
    }

    logger.info(`Payment refunded: ${payment.transactionId}`);
    return updatedPayment;
  }

  
  async getByVendor(vendorId, companyId) {
    return prisma.payment.findMany({
      where: { vendorId, companyId },
      include: {
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  
  async getByInvoice(invoiceId, companyId) {
    return prisma.payment.findFirst({
      where: { invoiceId, companyId },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  
  async getHistory({ startDate, endDate }, companyId) {
    return prisma.payment.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        vendor: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  
  async getStats(companyId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [completed, pending, refunded, thisMonth, total] = await Promise.all([
      prisma.payment.count({ where: { companyId, status: 'COMPLETED' } }),
      prisma.payment.count({ where: { companyId, status: 'PENDING' } }),
      prisma.payment.count({ where: { companyId, status: 'REFUNDED' } }),
      prisma.payment.aggregate({
        where: {
          companyId,
          status: 'COMPLETED',
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { companyId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      completedCount: completed,
      pendingCount: pending,
      refundedCount: refunded,
      thisMonthTotal: thisMonth._sum.amount || 0,
      thisMonthCount: thisMonth._count || 0,
      totalPaid: total._sum.amount || 0,
    };
  }
}

module.exports = new PaymentService();
