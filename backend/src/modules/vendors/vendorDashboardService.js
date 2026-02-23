
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class VendorDashboardService {
    calculateContractStatus(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (end < today) {
      return 'EXPIRED';
    } else if (end <= sevenDaysFromNow) {
      return 'EXPIRING';
    } else {
      return 'ACTIVE';
    }
  }

    async getDashboardData(vendorId, companyId) {
    try {
      const [
        overview,
        contracts,
        invoices,
        payments,
        notifications
      ] = await Promise.all([
        this.getOverviewStats(vendorId, companyId),
        this.getContracts(vendorId, companyId),
        this.getInvoices(vendorId, companyId),
        this.getPayments(vendorId, companyId),
        this.getNotifications(vendorId, companyId),
      ]);

      return {
        overview,
        contracts,
        invoices,
        payments,
        notifications,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error fetching dashboard data for vendor ${vendorId}:`, error);
      throw error;
    }
  }

    async getOverviewStats(vendorId, companyId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    
    const contracts = await prisma.contract.findMany({
      where: { vendorId, companyId },
      select: { id: true, amount: true, endDate: true, status: true },
    });

    
    const contractStats = contracts.map(c => ({
      ...c,
      calculatedStatus: this.calculateContractStatus(c.endDate),
    }));

    const activeContracts = contractStats.filter(c => c.calculatedStatus === 'ACTIVE').length;
    const expiringContracts = contractStats.filter(c => c.calculatedStatus === 'EXPIRING').length;
    const expiredContracts = contractStats.filter(c => c.calculatedStatus === 'EXPIRED').length;

    const totalContractValue = contracts.reduce((sum, c) => sum + (c.amount || 0), 0);

    
    const invoiceStats = await Promise.all([
      prisma.invoice.count({ where: { vendorId, companyId, status: 'PENDING' } }),
      prisma.invoice.count({ where: { vendorId, companyId, status: 'APPROVED' } }),
      prisma.invoice.count({ where: { vendorId, companyId, status: 'PAID' } }),
      prisma.invoice.count({ where: { vendorId, companyId, status: 'OVERDUE' } }),
      prisma.invoice.count({ where: { vendorId, companyId, status: 'REJECTED' } }),
      prisma.invoice.aggregate({
        where: { vendorId, companyId, status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { vendorId, companyId, status: 'OVERDUE' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          vendorId,
          companyId,
          status: 'PAID',
          paidDate: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    
    const paymentStats = await Promise.all([
      prisma.payment.aggregate({
        where: { vendorId, companyId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          vendorId,
          companyId,
          status: 'COMPLETED',
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          vendorId,
          companyId,
          status: 'COMPLETED',
          paymentDate: { gte: startOfYear },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      
      activeContracts,
      expiringContracts,
      expiredContracts,
      totalContractValue,

      
      pendingInvoices: invoiceStats[0],
      approvedInvoices: invoiceStats[1],
      paidInvoices: invoiceStats[2],
      overdueInvoices: invoiceStats[3],
      rejectedInvoices: invoiceStats[4],
      pendingAmount: invoiceStats[5]._sum.totalAmount || 0,
      overdueAmount: invoiceStats[6]._sum.totalAmount || 0,

      
      totalEarnings: paymentStats[0]._sum.amount || 0,
      paidThisMonth: paymentStats[1]._sum.amount || 0,
      paymentsThisMonth: paymentStats[1]._count || 0,
      totalEarningsThisYear: paymentStats[2]._sum.amount || 0,
    };
  }

    async getContracts(vendorId, companyId) {
    const contracts = await prisma.contract.findMany({
      where: { vendorId, companyId },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        currency: true,
        paymentCycle: true,
        startDate: true,
        endDate: true,
        status: true,
        autoRenew: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    
    return contracts.map(contract => ({
      ...contract,
      calculatedStatus: this.calculateContractStatus(contract.endDate),
      startDate: contract.startDate?.toISOString(),
      endDate: contract.endDate?.toISOString(),
      createdAt: contract.createdAt?.toISOString(),
    }));
  }

    async getInvoices(vendorId, companyId) {
    const invoices = await prisma.invoice.findMany({
      where: { vendorId, companyId },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        gstRate: true,
        gstAmount: true,
        totalAmount: true,
        description: true,
        status: true,
        dueDate: true,
        issueDate: true,
        paidDate: true,
        fileUrl: true,
        notes: true,
        contractId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, 
    });

    return invoices.map(invoice => ({
      ...invoice,
      dueDate: invoice.dueDate?.toISOString(),
      issueDate: invoice.issueDate?.toISOString(),
      paidDate: invoice.paidDate?.toISOString(),
      createdAt: invoice.createdAt?.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString(),
    }));
  }

    async getPayments(vendorId, companyId) {
    const payments = await prisma.payment.findMany({
      where: { vendorId, companyId },
      select: {
        id: true,
        amount: true,
        currency: true,
        transactionId: true,
        method: true,
        status: true,
        paymentDate: true,
        notes: true,
        receiptUrl: true,
        invoiceId: true,
        createdAt: true,
      },
      orderBy: { paymentDate: 'desc' },
      take: 50, 
    });

    return payments.map(payment => ({
      ...payment,
      paymentDate: payment.paymentDate?.toISOString(),
      createdAt: payment.createdAt?.toISOString(),
    }));
  }

    async getNotifications(vendorId, companyId, limit = 20) {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt?.toISOString(),
    }));
  }

    async getUnreadNotificationCount(vendorId) {
    return prisma.notification.count({
      where: {
        isRead: false,
      },
    });
  }

    async markNotificationRead(notificationId, vendorId) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

    async markAllNotificationsRead(vendorId) {
    const result = await prisma.notification.updateMany({
      where: {
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return result.count;
  }
}

module.exports = new VendorDashboardService();

