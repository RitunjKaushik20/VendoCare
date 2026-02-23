
const adminDashboardService = require('./adminDashboardService');
const { ok, badRequest } = require('../../core/utils/response');

class AdminDashboardController {
    async getDashboard(req, res) {
    try {
      console.log('AdminDashboardController - req.companyId:', req.companyId);
      console.log('AdminDashboardController - req.user.companyId:', req.user?.companyId);
      console.log('AdminDashboardController - req.user.company:', req.user?.company);
      console.log('AdminDashboardController - req.user:', req.user ? 'exists' : 'null');
      
      
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      
      console.log('AdminDashboardController - Final companyId:', companyId);
      
      if (!companyId) {
        console.error('No companyId found for user:', req.user?.email);
        
        return ok(res, {
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
        }, 'Dashboard retrieved (no companyId - showing empty)');
      }
      
      const dashboard = await adminDashboardService.getDashboardSummary(companyId);
      return ok(res, dashboard, 'Dashboard retrieved');
    } catch (error) {
      console.error('AdminDashboardController error:', error);
      return badRequest(res, error.message);
    }
  }

    async getStats(req, res) {
    try {
      console.log('AdminDashboardController getStats - req.companyId:', req.companyId);
      console.log('AdminDashboardController getStats - req.user.companyId:', req.user?.companyId);
      
      
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      
      console.log('AdminDashboardController getStats - Final companyId:', companyId);
      
      const stats = await adminDashboardService.getLiveStats(companyId);
      return ok(res, stats, 'Stats retrieved');
    } catch (error) {
      console.error('AdminDashboardController getStats error:', error);
      return badRequest(res, error.message);
    }
  }

    async getOutstandingInvoices(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoices = await adminDashboardService.getOutstandingInvoices(companyId);
      return ok(res, invoices, 'Outstanding invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getExpiringContracts(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const days = parseInt(req.query.days) || 7;
      const contracts = await adminDashboardService.getExpiringContracts(companyId, days);
      return ok(res, contracts, 'Expiring contracts retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getVendorFinancials(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const vendorId = req.params.vendorId || null;
      const financials = await adminDashboardService.getVendorFinancials(companyId, vendorId);
      return ok(res, financials, 'Vendor financials retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async checkVendorDelete(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { vendorId } = req.params;
      const result = await adminDashboardService.canDeleteVendor(companyId, vendorId);
      return ok(res, result, 'Vendor deletion check completed');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getActivities(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const limit = parseInt(req.query.limit) || 20;
      const activities = await adminDashboardService.getRecentActivities(companyId, limit);
      return ok(res, activities, 'Activities retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getMonthlySpend(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const monthlyData = await adminDashboardService.getMonthlySpend(companyId, year);
      return ok(res, monthlyData, 'Monthly spend retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getFinancialSummary(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const summary = await adminDashboardService.getFinancialSummary(companyId);
      return ok(res, summary, 'Financial summary retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new AdminDashboardController();

