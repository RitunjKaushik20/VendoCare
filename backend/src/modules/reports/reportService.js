
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class ReportService {
  
  async getSpendingReport({ month, year }, companyId) {
    
    const now = new Date();
    const reportMonth = month ? parseInt(month) : now.getMonth() + 1;
    const reportYear = year ? parseInt(year) : now.getFullYear();
    
    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);

    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        status: 'COMPLETED',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vendor: { select: { id: true, name: true, category: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    
    const vendorSpending = {};
    let total = 0;

    payments.forEach((payment) => {
      const vendorId = payment.vendor.id;
      if (!vendorSpending[vendorId]) {
        vendorSpending[vendorId] = {
          vendor: payment.vendor,
          total: 0,
          count: 0,
          payments: [],
        };
      }
      vendorSpending[vendorId].total += payment.amount;
      vendorSpending[vendorId].count += 1;
      vendorSpending[vendorId].payments.push(payment);
      total += payment.amount;
    });

    return {
      month: reportMonth,
      year: reportYear,
      total,
      vendorCount: Object.keys(vendorSpending).length,
      vendorSpending: Object.values(vendorSpending),
      payments,
    };
  }

  
  async getOverdueReport(companyId) {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: 'OVERDUE',
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        contract: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalOverdue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const byVendor = {};

    invoices.forEach((invoice) => {
      const vendorId = invoice.vendor.id;
      if (!byVendor[vendorId]) {
        byVendor[vendorId] = {
          vendor: invoice.vendor,
          count: 0,
          total: 0,
          invoices: [],
        };
      }
      byVendor[vendorId].count += 1;
      byVendor[vendorId].total += invoice.totalAmount;
      byVendor[vendorId].invoices.push(invoice);
    });

    return {
      total: totalOverdue,
      invoiceCount: invoices.length,
      vendorCount: Object.keys(byVendor).length,
      byVendor: Object.values(byVendor),
      invoices,
    };
  }

  
  async getTaxReport({ startDate, endDate }, companyId) {
    
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1); 
    const defaultEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59); 
    
    const reportStartDate = startDate ? new Date(startDate) : defaultStart;
    const reportEndDate = endDate ? new Date(endDate) : defaultEnd;
    
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        createdAt: {
          gte: reportStartDate,
          lte: reportEndDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      totalAmount: 0,
      totalGst: 0,
      gstRateBreakdown: {},
      invoices: invoices.length,
    };

    invoices.forEach((invoice) => {
      summary.totalAmount += invoice.amount;
      summary.totalGst += invoice.gstAmount;

      const rate = invoice.gstRate;
      if (!summary.gstRateBreakdown[rate]) {
        summary.gstRateBreakdown[rate] = { amount: 0, gst: 0, count: 0 };
      }
      summary.gstRateBreakdown[rate].amount += invoice.amount;
      summary.gstRateBreakdown[rate].gst += invoice.gstAmount;
      summary.gstRateBreakdown[rate].count += 1;
    });

    return summary;
  }

  
  async getVendorWiseReport(companyId) {
    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      include: {
        contracts: { select: { id: true, amount: true } },
        invoices: { select: { id: true, totalAmount: true, status: true } },
        payments: { where: { status: 'COMPLETED' }, select: { id: true, amount: true } },
      },
    });

    return vendors.map((vendor) => ({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
      },
      contractValue: vendor.contracts.reduce((sum, c) => sum + c.amount, 0),
      invoicedAmount: vendor.invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      paidAmount: vendor.payments.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: vendor.invoices
        .filter((i) => i.status === 'PENDING')
        .reduce((sum, i) => sum + i.totalAmount, 0),
      contractCount: vendor.contracts.length,
      invoiceCount: vendor.invoices.length,
      paymentCount: vendor.payments.length,
    }));
  }

  
  async getContractWiseReport(companyId) {
    const contracts = await prisma.contract.findMany({
      where: { companyId },
      include: {
        vendor: { select: { id: true, name: true } },
        invoices: { select: { id: true, totalAmount: true, status: true } },
        payments: { where: { status: 'COMPLETED' }, select: { id: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map((contract) => ({
      contract: {
        id: contract.id,
        title: contract.title,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        amount: contract.amount,
      },
      vendor: contract.vendor,
      invoicedAmount: contract.invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      paidAmount: contract.payments.reduce((sum, p) => sum + p.amount, 0),
      invoiceCount: contract.invoices.length,
      paymentCount: contract.payments.length,
    }));
  }

  
  async getDashboardStats(companyId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalVendors,
      activeContracts,
      pendingInvoices,
      overdueInvoices,
      monthlyPayments,
      yearlyPayments,
      recentInvoices,
      recentPayments,
      expiringContracts,
    ] = await Promise.all([
      prisma.vendor.count({ where: { companyId } }),
      prisma.contract.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.invoice.count({ where: { companyId, status: 'PENDING' } }),
      prisma.invoice.count({ where: { companyId, status: 'OVERDUE' } }),
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
      prisma.invoice.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { name: true } } },
      }),
      prisma.payment.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { name: true } } },
      }),
      prisma.contract.count({
        where: {
          companyId,
          status: 'ACTIVE',
          endDate: {
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      overview: {
        totalVendors,
        activeContracts,
        pendingInvoices,
        overdueInvoices,
        expiringContracts,
      },
      payments: {
        monthly: monthlyPayments._sum.amount || 0,
        yearly: yearlyPayments._sum.amount || 0,
      },
      recentActivity: {
        invoices: recentInvoices,
        payments: recentPayments,
      },
    };
  }

  
  async getRecentActivities(companyId, limit = 10) {
    const now = new Date();
    const activities = [];

    
    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { name: true } },
        contract: { select: { title: true } },
      },
    });

    
    const recentPayments = await prisma.payment.findMany({
      where: { companyId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { name: true } },
        invoice: { select: { invoiceNumber: true } },
      },
    });

    
    const recentContracts = await prisma.contract.findMany({
      where: { companyId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { name: true } },
      },
    });

    
    const recentVendors = await prisma.vendor.findMany({
      where: { companyId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    
    recentInvoices.forEach((invoice) => {
      activities.push({
        id: invoice.id,
        type: 'INVOICE_CREATED',
        action: 'Invoice Created',
        entity: 'Invoice',
        entityId: invoice.id,
        description: `New invoice ${invoice.invoiceNumber} created for ${invoice.vendor?.name || 'Unknown'}`,
        amount: invoice.totalAmount,
        status: invoice.status,
        timestamp: invoice.createdAt,
        vendor: invoice.vendor?.name,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          dueDate: invoice.dueDate,
        },
      });
    });

    
    recentPayments.forEach((payment) => {
      activities.push({
        id: payment.id,
        type: 'PAYMENT_MADE',
        action: 'Payment Processed',
        entity: 'Payment',
        entityId: payment.id,
        description: `Payment of ${payment.amount} made to ${payment.vendor?.name || 'Unknown'}`,
        amount: payment.amount,
        status: payment.status,
        timestamp: payment.createdAt,
        vendor: payment.vendor?.name,
        metadata: {
          transactionId: payment.transactionId,
          method: payment.method,
        },
      });
    });

    
    recentContracts.forEach((contract) => {
      activities.push({
        id: contract.id,
        type: 'CONTRACT_CREATED',
        action: 'Contract Created',
        entity: 'Contract',
        entityId: contract.id,
        description: `New contract "${contract.title}" created with ${contract.vendor?.name || 'Unknown'}`,
        amount: contract.amount,
        status: contract.status,
        timestamp: contract.createdAt,
        vendor: contract.vendor?.name,
        metadata: {
          startDate: contract.startDate,
          endDate: contract.endDate,
        },
      });
    });

    
    recentVendors.forEach((vendor) => {
      activities.push({
        id: vendor.id,
        type: 'VENDOR_ADDED',
        action: 'Vendor Added',
        entity: 'Vendor',
        entityId: vendor.id,
        description: `New vendor "${vendor.name}" added to the system`,
        amount: null,
        status: vendor.status,
        timestamp: vendor.createdAt,
        vendor: vendor.name,
        metadata: {
          category: vendor.category,
          email: vendor.email,
        },
      });
    });

    
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    
    return activities.slice(0, limit);
  }

  
  async exportToCsv(reportType, filters, companyId) {
    let data;
    let headers;

    switch (reportType) {
      case 'spending':
        const spending = await this.getSpendingReport(filters, companyId);
        data = spending.vendorSpending.map((vs) => ({
          Vendor: vs.vendor.name,
          Category: vs.vendor.category || 'N/A',
          'Total Spent': vs.total,
          'Payment Count': vs.count,
        }));
        headers = ['Vendor', 'Category', 'Total Spent', 'Payment Count'];
        break;

      case 'overdue':
        const overdue = await this.getOverdueReport(companyId);
        const now = new Date();
        data = overdue.invoices.map((inv) => ({
          Invoice: inv.invoiceNumber,
          Vendor: inv.vendor.name,
          Amount: inv.totalAmount,
          'Due Date': inv.dueDate instanceof Date ? inv.dueDate.toISOString().split('T')[0] : inv.dueDate,
          'Days Overdue': Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)),
        }));
        headers = ['Invoice', 'Vendor', 'Amount', 'Due Date', 'Days Overdue'];
        break;

      case 'vendor-wise':
        const vendorReport = await this.getVendorWiseReport(companyId);
        data = vendorReport.map((v) => ({
          Vendor: v.vendor.name,
          Category: v.vendor.category,
          'Contract Value': v.contractValue,
          'Invoiced Amount': v.invoicedAmount,
          'Paid Amount': v.paidAmount,
          'Pending Amount': v.pendingAmount,
        }));
        headers = ['Vendor', 'Category', 'Contract Value', 'Invoiced Amount', 'Paid Amount', 'Pending Amount'];
        break;

      default:
        throw new Error('Invalid report type');
    }

    return { headers, data };
  }
}

module.exports = new ReportService();
