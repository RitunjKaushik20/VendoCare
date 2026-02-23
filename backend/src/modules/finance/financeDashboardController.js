
const financeDashboardService = require('./financeDashboardService');
const { ok, badRequest } = require('../../core/utils/response');

class FinanceDashboardController {
    async getDashboard(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const dashboard = await financeDashboardService.getDashboard(companyId);
      return ok(res, dashboard, 'Finance dashboard retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getPayableQueue(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { sortBy = 'dueDate', sortOrder = 'asc', vendorId } = req.query;
      const queue = await financeDashboardService.getPayableQueue(companyId, {
        sortBy,
        sortOrder,
        vendorId,
      });
      return ok(res, queue, 'Payable queue retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getOverdueInvoices(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoices = await financeDashboardService.getOverdueInvoices(companyId);
      return ok(res, invoices, 'Overdue invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getAgingAnalysis(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const aging = await financeDashboardService.getAgingBuckets(companyId);
      return ok(res, aging, 'Aging analysis retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getVendorLedger(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { vendorId } = req.params;
      const summary = await financeDashboardService.getVendorSummary(companyId);
      
      if (vendorId) {
        const vendorData = summary.find(v => v.id === vendorId);
        return ok(res, vendorData, 'Vendor ledger retrieved');
      }
      
      return ok(res, summary, 'Vendor ledger summary retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getRecentPayments(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { limit = 10 } = req.query;
      const payments = await financeDashboardService.getRecentPayments(companyId, parseInt(limit));
      return ok(res, payments, 'Recent payments retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getMonthlySpend(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { month, year } = req.query;
      const spend = await financeDashboardService.getMonthlySpend(
        companyId,
        month ? parseInt(month) : null,
        year ? parseInt(year) : null
      );
      return ok(res, spend, 'Monthly spend retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getGstSummary(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const gst = await financeDashboardService.getGstSummary(companyId);
      return ok(res, gst, 'GST summary retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async processPayment(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { invoiceId } = req.params;
      const { transactionId, bankReference, paymentDate, notes, method, amount } = req.body;

      const payment = await financeDashboardService.processPayment(companyId, invoiceId, {
        transactionId,
        bankReference,
        paymentDate,
        notes,
        method,
        amount,
      });

      return ok(res, payment, 'Payment processed successfully');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getPaymentHistory(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { startDate, endDate, vendorId } = req.query;
      const history = await financeDashboardService.getPaymentHistory(companyId, {
        startDate,
        endDate,
        vendorId,
      });
      return ok(res, history, 'Payment history retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getLiveStats(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const stats = await financeDashboardService.getLiveStats(companyId);
      return ok(res, stats, 'Live stats retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getTotalOutstanding(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const outstanding = await financeDashboardService.getTotalOutstanding(companyId);
      return ok(res, outstanding, 'Total outstanding retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new FinanceDashboardController();

