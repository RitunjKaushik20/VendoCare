
const reportService = require('./reportService');
const { ok, badRequest } = require('../../core/utils/response');

class ReportController {
  
  async getSpendingReport(req, res) {
    try {
      const { month, year } = req.query;
      const report = await reportService.getSpendingReport(
        { month: parseInt(month), year: parseInt(year) },
        req.user.companyId
      );
      return ok(res, report, 'Spending report retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getOverdueReport(req, res) {
    try {
      const report = await reportService.getOverdueReport(req.user.companyId);
      return ok(res, report, 'Overdue report retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getTaxReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getTaxReport({ startDate, endDate }, req.user.companyId);
      return ok(res, report, 'Tax report retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getVendorWiseReport(req, res) {
    try {
      const report = await reportService.getVendorWiseReport(req.user.companyId);
      return ok(res, report, 'Vendor-wise report retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getContractWiseReport(req, res) {
    try {
      const report = await reportService.getContractWiseReport(req.user.companyId);
      return ok(res, report, 'Contract-wise report retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getDashboardStats(req, res) {
    try {
      const stats = await reportService.getDashboardStats(req.user.companyId);
      return ok(res, stats, 'Dashboard statistics retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getRecentActivities(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const activities = await reportService.getRecentActivities(limit, req.user.companyId);
      return ok(res, activities, 'Recent activities retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async exportCsv(req, res) {
    try {
      const { type } = req.params;
      const { month, year } = req.query;
      const { headers, data } = await reportService.exportToCsv(
        type,
        { month: parseInt(month), year: parseInt(year) },
        req.user.companyId
      );

      
      const csvRows = [headers.join(',')];
      data.forEach((row) => {
        csvRows.push(Object.values(row).join(','));
      });
      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      return res.send(csv);
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new ReportController();
