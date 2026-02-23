
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class FinanceDashboardService {
    async getDashboard(companyId) {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      payableQueue,
      overdueInvoices,
      totalOutstanding,
      agingBuckets,
      monthlySpend,
      vendorSummary,
      recentPayments,
      gstSummary,
      thisMonthSpend,
      lastMonthSpend,
    ] = await Promise.all([
      
      this.getPayableQueue(companyId),
      
      this.getOverdueInvoices(companyId),
      
      this.getTotalOutstanding(companyId),
      
      this.getAgingBuckets(companyId),
      
      this.getMonthlySpend(companyId),
      
      this.getVendorSummary(companyId),
      
      this.getRecentPayments(companyId, 10),
      
      this.getGstSummary(companyId),
      
      this.getMonthlySpend(companyId, now.getMonth() + 1, now.getFullYear()),
      
      this.getMonthlySpend(companyId, now.getMonth(), now.getFullYear()),
    ]);

    return {
      overview: {
        totalOutstanding,
        payableQueue: payableQueue.length,
        overdueCount: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      },
      aging: agingBuckets,
      monthlySpend: {
        thisMonth: thisMonthSpend,
        lastMonth: lastMonthSpend,
        trend: lastMonthSpend > 0 ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend * 100).toFixed(1) : 0,
      },
      gst: gstSummary,
      payableQueue,
      overdueInvoices,
      recentPayments,
      vendorSummary: vendorSummary.slice(0, 10), 
    };
  }

    async getPayableQueue(companyId, options = {}) {
    const { sortBy = 'dueDate', sortOrder = 'asc', vendorId = null } = options;

    const where = {
      companyId,
      status: { in: ['APPROVED', 'OVERDUE'] },
      ...(vendorId && { vendorId }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true, email: true, bankName: true, bankAccount: true, ifscCode: true },
        },
        contract: {
          select: { id: true, title: true, paymentCycle: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    return invoices.map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0;

      return {
        ...invoice,
        vendor: invoice.vendor,
        contract: invoice.contract,
        daysUntilDue: Math.abs(daysUntilDue),
        isOverdue,
        gstAmount: invoice.gstAmount || 0,
        netPayable: invoice.totalAmount - (invoice.gstAmount || 0),
      };
    });
  }

    async getOverdueInvoices(companyId) {
    const now = new Date();

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['APPROVED', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
        contract: {
          select: { id: true, title: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));

      return {
        ...invoice,
        daysOverdue,
        gstAmount: invoice.gstAmount || 0,
        netPayable: invoice.totalAmount - (invoice.gstAmount || 0),
      };
    });
  }

    async getTotalOutstanding(companyId) {
    const result = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['APPROVED', 'OVERDUE'] },
      },
      _sum: { totalAmount: true, gstAmount: true },
    });

    const gstAmount = result._sum.gstAmount || 0;
    const totalAmount = result._sum.totalAmount || 0;

    return {
      total: totalAmount,
      excludingGst: totalAmount - gstAmount,
      gst: gstAmount,
      invoiceCount: await prisma.invoice.count({
        where: { companyId, status: { in: ['APPROVED', 'OVERDUE'] } },
      }),
    };
  }

    async getAgingBuckets(companyId) {
    const now = new Date();
    
    const [current, sevenDays, thirtyDays, sixtyDays, ninetyPlus] = await Promise.all([
      
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: { in: ['APPROVED'] },
          dueDate: { gte: now },
        },
        _sum: { totalAmount: true },
      }),
      
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: { in: ['APPROVED', 'OVERDUE'] },
          dueDate: {
            lt: now,
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { totalAmount: true },
      }),
      
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: 'OVERDUE',
          dueDate: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { totalAmount: true },
      }),
      
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: 'OVERDUE',
          dueDate: {
            lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { totalAmount: true },
      }),
      
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: 'OVERDUE',
          dueDate: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      current: { amount: current._sum.totalAmount || 0, label: 'Current', color: 'green' },
      '1-7': { amount: sevenDays._sum.totalAmount || 0, label: '1-7 Days', color: 'yellow' },
      '8-30': { amount: thirtyDays._sum.totalAmount || 0, label: '8-30 Days', color: 'orange' },
      '31-60': { amount: sixtyDays._sum.totalAmount || 0, label: '31-60 Days', color: 'red' },
      '60+': { amount: ninetyPlus._sum.totalAmount || 0, label: '60+ Days', color: 'dark-red' },
    };
  }

    async getMonthlySpend(companyId, month = null, year = null) {
    const now = new Date();
    const targetMonth = month !== null ? month : now.getMonth();
    const targetYear = year !== null ? year : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    const result = await prisma.payment.aggregate({
      where: {
        companyId,
        status: 'COMPLETED',
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      amount: result._sum.amount || 0,
      count: result._count || 0,
      month: targetMonth + 1,
      year: targetYear,
    };
  }

    async getVendorSummary(companyId) {
    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      include: {
        invoices: {
          select: { id: true, status: true, totalAmount: true, gstAmount: true },
        },
        payments: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
    });

    return vendors.map((vendor) => {
      const totalInvoiced = vendor.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = vendor.payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingInvoices = vendor.invoices.filter((inv) => 
        ['PENDING', 'APPROVED', 'OVERDUE'].includes(inv.status)
      );
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        totalInvoiced,
        totalPaid,
        pendingAmount,
        pendingCount: pendingInvoices.length,
        gstPaid: vendor.invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0),
      };
    }).sort((a, b) => b.pendingAmount - a.pendingAmount);
  }

    async getRecentPayments(companyId, limit = 10) {
    return prisma.payment.findMany({
      where: { companyId },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });
  }

    async getGstSummary(companyId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        createdAt: { gte: startOfMonth },
      },
      select: { gstAmount: true, totalAmount: true },
    });

    const totalGst = invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      totalGst,
      totalAmount,
      gstRate: 18, 
      invoicesProcessed: invoices.length,
    };
  }

    async processPayment(companyId, invoiceId, paymentData) {
    const { transactionId, bankReference, paymentDate, notes } = paymentData;

    
    if (transactionId) {
      const existing = await prisma.payment.findUnique({
        where: { transactionId },
      });
      if (existing) {
        throw new Error('Transaction ID already exists');
      }
    }

    
    const txnId = transactionId || `TXN-${Date.now().toString(36).toUpperCase()}`;

    
    const payment = await prisma.payment.create({
      data: {
        amount: paymentData.amount,
        currency: 'INR',
        transactionId: txnId,
        method: paymentData.method || 'BANK_TRANSFER',
        status: 'COMPLETED',
        paymentDate: new Date(paymentDate || Date.now()),
        notes: notes || null,
        companyId,
        vendorId: paymentData.vendorId,
        invoiceId,
      },
    });

    
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidDate: new Date(paymentDate || Date.now()),
      },
    });

    logger.info(`Payment processed: ${txnId} for invoice ${invoiceId}`);
    return payment;
  }

    async getPaymentHistory(companyId, options = {}) {
    const { startDate, endDate, vendorId } = options;

    const where = {
      companyId,
      ...(vendorId && { vendorId }),
      ...(startDate && endDate && {
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    return prisma.payment.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

    async getLiveStats(companyId) {
    const now = new Date();

    const [payableCount, overdueCount, todayPayments, monthlyTotal] = await Promise.all([
      prisma.invoice.count({
        where: { companyId, status: 'APPROVED' },
      }),
      prisma.invoice.count({
        where: {
          companyId,
          status: 'OVERDUE',
          dueDate: { lt: now },
        },
      }),
      prisma.payment.aggregate({
        where: {
          companyId,
          status: 'COMPLETED',
          paymentDate: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          companyId,
          status: 'COMPLETED',
          paymentDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      timestamp: new Date().toISOString(),
      payableCount,
      overdueCount,
      todayPayments: todayPayments._sum.amount || 0,
      monthlyTotal: monthlyTotal._sum.amount || 0,
    };
  }
}

module.exports = new FinanceDashboardService();

