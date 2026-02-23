
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');


const getFallbackData = () => ({
  overview: {
    totalVendors: 0,
    activeVendors: 0,
    totalContracts: 0,
    activeContracts: 0,
    expiringContracts: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    approvedInvoices: 0,
    overdueInvoices: 0,
    totalPayments: 0,
  },
  financials: {
    monthlyPayments: 0,
    monthlyCount: 0,
    yearlyPayments: 0,
    yearlyCount: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalInvoiceValue: 0,
  },
  topVendors: [],
});


const safePrismaQuery = async (queryFn, fallbackValue = []) => {
  try {
    return await queryFn();
  } catch (error) {
    logger.error('Prisma query error:', error.message);
    return fallbackValue;
  }
};

class AdminDashboardService {
    async getDashboardSummary(companyId) {
    try {
      
      if (!companyId) {
        logger.warn('getDashboardSummary called without companyId');
        return getFallbackData();
      }

      logger.info(`Getting dashboard summary for company: ${companyId}`);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const [
        vendors,
        activeVendors,
        contracts,
        activeContracts,
        expiringContracts,
        invoices,
        pendingInvoices,
        approvedInvoices,
        overdueInvoices,
        totalPayments,
        monthlyPayments,
        yearlyPayments,
        vendorStats,
        invoiceStats,
      ] = await Promise.all([
        
        prisma.vendor.count({ where: { companyId } }),
        
        prisma.vendor.count({ where: { companyId, status: 'ACTIVE' } }),
        
        prisma.contract.count({ where: { companyId } }),
        
        prisma.contract.count({ where: { companyId, status: 'ACTIVE' } }),
        
        prisma.contract.count({
          where: {
            companyId,
            status: 'ACTIVE',
            endDate: {
              lte: sevenDaysLater,
              gte: now,
            },
          },
        }),
        
        prisma.invoice.count({ where: { companyId } }),
        
        prisma.invoice.count({ where: { companyId, status: 'PENDING' } }),
        
        prisma.invoice.count({ where: { companyId, status: 'APPROVED' } }),
        
        prisma.invoice.count({
          where: {
            companyId,
            status: 'PENDING',
            dueDate: { lt: now },
          },
        }),
        
        prisma.payment.count({ where: { companyId, status: 'COMPLETED' } }),
        
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
          where: {
            companyId,
            status: 'COMPLETED',
            paymentDate: { gte: startOfYear },
          },
          _sum: { amount: true },
          _count: true,
        }),
        
        prisma.vendor.findMany({
          where: { companyId },
          select: {
            id: true,
            name: true,
            status: true,
            totalSpent: true,
            _count: { select: { contracts: true, invoices: true } },
          },
          orderBy: { totalSpent: 'desc' },
          take: 5,
        }),
        
        prisma.invoice.aggregate({
          where: { companyId },
          _sum: { totalAmount: true },
        }),
      ]);

      
      const totalPending = pendingInvoices;
      const totalOverdue = invoiceStats._sum.totalAmount
        ? await this.getOverdueAmount(companyId)
        : 0;

      return {
        overview: {
          totalVendors: vendors,
          activeVendors,
          totalContracts: contracts,
          activeContracts,
          expiringContracts,
          totalInvoices: invoices,
          pendingInvoices,
          approvedInvoices,
          overdueInvoices,
          totalPayments,
        },
        financials: {
          monthlyPayments: monthlyPayments._sum.amount || 0,
          monthlyCount: monthlyPayments._count || 0,
          yearlyPayments: yearlyPayments._sum.amount || 0,
          yearlyCount: yearlyPayments._count || 0,
          totalPending,
          totalOverdue,
          totalInvoiceValue: invoiceStats._sum.totalAmount || 0,
        },
        topVendors: vendorStats,
      };
    } catch (error) {
      logger.error('Error in getDashboardSummary:', error);
      console.error(error);
      return getFallbackData();
    }
  }

    async getLiveStats(companyId) {
    try {
      
      if (!companyId) {
        logger.warn('getLiveStats called without companyId');
        return {
          timestamp: new Date().toISOString(),
          pendingInvoices: 0,
          pendingAmount: 0,
          approvedInvoices: 0,
          approvedAmount: 0,
          overdueInvoices: 0,
          overdueAmount: 0,
          expiringContracts: 0,
          activeVendors: 0,
          monthlyPayments: 0,
        };
      }

      logger.info(`Getting live stats for company: ${companyId}`);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const [
        pendingInvoices,
        approvedInvoices,
        overdueInvoices,
        expiringContracts,
        activeVendors,
      ] = await Promise.all([
        prisma.invoice.count({
          where: { companyId, status: 'PENDING' },
        }),
        prisma.invoice.count({
          where: { companyId, status: 'APPROVED' },
        }),
        prisma.invoice.count({
          where: {
            companyId,
            status: 'PENDING',
            dueDate: { lt: now },
          },
        }),
        prisma.contract.count({
          where: {
            companyId,
            status: 'ACTIVE',
            endDate: {
              lte: sevenDaysLater,
              gte: now,
            },
          },
        }),
        prisma.vendor.count({
          where: { companyId, status: 'ACTIVE' },
        }),
      ]);

      
      const [pendingAmount, approvedAmount, overdueAmount, monthlyPayments] = await Promise.all([
        prisma.invoice.aggregate({
          where: { companyId, status: 'PENDING' },
          _sum: { totalAmount: true },
        }),
        prisma.invoice.aggregate({
          where: { companyId, status: 'APPROVED' },
          _sum: { totalAmount: true },
        }),
        prisma.invoice.aggregate({
          where: {
            companyId,
            status: 'PENDING',
            dueDate: { lt: now },
          },
          _sum: { totalAmount: true },
        }),
        prisma.payment.aggregate({
          where: {
            companyId,
            status: 'COMPLETED',
            paymentDate: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        timestamp: now.toISOString(),
        pendingInvoices,
        pendingAmount: pendingAmount._sum.totalAmount || 0,
        approvedInvoices,
        approvedAmount: approvedAmount._sum.totalAmount || 0,
        overdueInvoices,
        overdueAmount: overdueAmount._sum.totalAmount || 0,
        expiringContracts,
        activeVendors,
        monthlyPayments: monthlyPayments._sum.amount || 0,
      };
    } catch (error) {
      console.error('Error in getLiveStats:', error.message, error.stack);
      return {
        timestamp: new Date().toISOString(),
        pendingInvoices: 0,
        pendingAmount: 0,
        approvedInvoices: 0,
        approvedAmount: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        expiringContracts: 0,
        activeVendors: 0,
        monthlyPayments: 0,
      };
    }
  }

    async getOutstandingInvoices(companyId) {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] },
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map((invoice) => ({
      ...invoice,
      daysOverdue: invoice.dueDate < new Date()
        ? Math.ceil((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
        : 0,
    }));
  }

    async getExpiringContracts(companyId, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const contracts = await prisma.contract.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
          gte: now,
        },
      },
      include: {
        vendor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return contracts.map((contract) => ({
      ...contract,
      daysUntilExpiry: Math.ceil(
        (new Date(contract.endDate) - now) / (1000 * 60 * 60 * 24)
      ),
    }));
  }

    async getVendorFinancials(companyId, vendorId = null) {
    const where = {
      companyId,
      ...(vendorId && { id: vendorId }),
    };

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            contracts: { where: { status: 'ACTIVE' } },
            invoices: true,
            payments: { where: { status: 'COMPLETED' } },
          },
        },
        invoices: {
          select: {
            status: true,
            totalAmount: true,
          },
        },
        payments: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
    });

    return vendors.map((vendor) => {
      
      const totalPaid = vendor.payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingInvoices = vendor.invoices.filter((i) => i.status === 'PENDING');
      const approvedInvoices = vendor.invoices.filter((i) => i.status === 'APPROVED');
      const overdueInvoices = vendor.invoices.filter(
        (i) => i.status === 'PENDING' && new Date(i.dueDate || 0) < new Date()
      );

      const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const approvedAmount = approvedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

      return {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        status: vendor.status,
        totalPaid,
        pendingAmount,
        approvedAmount,
        overdueAmount,
        activeContracts: vendor._count.contracts,
        totalInvoices: vendor._count.invoices,
        totalPayments: vendor._count.payments,
      };
    });
  }

    async canDeleteVendor(companyId, vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, companyId },
    });

    if (!vendor) {
      return { canDelete: false, reason: 'Vendor not found' };
    }

    
    const activeContracts = await prisma.contract.count({
      where: {
        vendorId,
        status: 'ACTIVE',
      },
    });

    if (activeContracts > 0) {
      return {
        canDelete: false,
        reason: `Vendor has ${activeContracts} active contract(s). Please terminate contracts first.`,
      };
    }

    
    const pendingInvoices = await prisma.invoice.count({
      where: {
        vendorId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (pendingInvoices > 0) {
      return {
        canDelete: false,
        reason: `Vendor has ${pendingInvoices} pending/approved invoice(s). Please process payments first.`,
      };
    }

    return { canDelete: true };
  }

    async getOverdueAmount(companyId) {
    const result = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      _sum: { totalAmount: true },
    });

    return result._sum.totalAmount || 0;
  }

    async getRecentActivities(companyId, limit = 20) {
    try {
      
      if (!companyId) {
        logger.warn('getRecentActivities called without companyId');
        return [];
      }

      const [invoices, contracts, vendors, payments] = await Promise.all([
        prisma.invoice.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            vendor: { select: { name: true } },
          },
        }),
        prisma.contract.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            vendor: { select: { name: true } },
          },
        }),
        prisma.vendor.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.payment.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            vendor: { select: { name: true } },
          },
        }),
      ]);

      
      const activities = [
        ...invoices.map((i) => ({
          id: i.id,
          type: 'INVOICE',
          action: i.status === 'PENDING' ? 'Invoice uploaded' : `Invoice ${i.status.toLowerCase()}`,
          entity: 'INVOICE',
          entityId: i.id,
          vendor: i.vendor?.name,
          amount: i.totalAmount,
          status: i.status,
          timestamp: i.createdAt,
        })),
        ...contracts.map((c) => ({
          id: c.id,
          type: 'CONTRACT',
          action: 'Contract created',
          entity: 'CONTRACT',
          entityId: c.id,
          vendor: c.vendor?.name,
          amount: c.amount,
          status: c.status,
          timestamp: c.createdAt,
        })),
        ...vendors.map((v) => ({
          id: v.id,
          type: 'VENDOR',
          action: 'Vendor added',
          entity: 'VENDOR',
          entityId: v.id,
          vendor: v.name,
          amount: null,
          status: v.status,
          timestamp: v.createdAt,
        })),
        ...payments.map((p) => ({
          id: p.id,
          type: 'PAYMENT',
          action: 'Payment processed',
          entity: 'PAYMENT',
          entityId: p.id,
          vendor: p.vendor?.name,
          amount: p.amount,
          status: p.status,
          timestamp: p.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return activities;
    } catch (error) {
      logger.error('Error in getRecentActivities:', error.message);
      return [];
    }
  }

    async getMonthlySpend(companyId, year = new Date().getFullYear()) {
    const monthlyData = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const startOfMonth = new Date(year, i, 1);
        const endOfMonth = new Date(year, i + 1, 0);
        return prisma.payment.aggregate({
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
      })
    );

    return monthlyData.map((data, index) => ({
      month: index + 1,
      monthName: new Date(year, index).toLocaleString('default', { month: 'short' }),
      amount: data._sum.amount || 0,
      count: data._count,
    }));
  }

    async getFinancialSummary(companyId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthlyPayments, yearlyPayments, pendingInvoices, approvedInvoices, overdueAmounts] =
      await Promise.all([
        prisma.payment.aggregate({
          where: {
            companyId,
            status: 'COMPLETED',
            paymentDate: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: {
            companyId,
            status: 'COMPLETED',
            paymentDate: { gte: startOfYear },
          },
          _sum: { amount: true },
        }),
        prisma.invoice.aggregate({
          where: { companyId, status: 'PENDING' },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: { companyId, status: 'APPROVED' },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: {
            companyId,
            status: 'PENDING',
            dueDate: { lt: now },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]);

    return {
      monthlyPayments: monthlyPayments._sum.amount || 0,
      yearlyPayments: yearlyPayments._sum.amount || 0,
      pendingInvoices: {
        count: pendingInvoices._count || 0,
        amount: pendingInvoices._sum.totalAmount || 0,
      },
      approvedInvoices: {
        count: approvedInvoices._count || 0,
        amount: approvedInvoices._sum.totalAmount || 0,
      },
      overdueInvoices: {
        count: overdueAmounts._count || 0,
        amount: overdueAmounts._sum.totalAmount || 0,
      },
    };
  }
}

module.exports = new AdminDashboardService();

