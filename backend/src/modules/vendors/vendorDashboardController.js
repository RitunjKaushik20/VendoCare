
const vendorDashboardService = require('./vendorDashboardService');
const { ok, badRequest, notFound, forbidden } = require('../../core/utils/response');

class VendorDashboardController {
    async getDashboard(req, res) {
    try {
      
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const vendorId = req.vendorId;
      const companyId = req.user.companyId;

      const dashboard = await vendorDashboardService.getDashboardData(vendorId, companyId);
      return ok(res, dashboard, 'Dashboard data retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getStats(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const stats = await vendorDashboardService.getOverviewStats(req.vendorId, req.user.companyId);
      return ok(res, stats, 'Stats retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getContracts(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const contracts = await vendorDashboardService.getContracts(req.vendorId, req.user.companyId);
      return ok(res, contracts, 'Contracts retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getInvoices(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const invoices = await vendorDashboardService.getInvoices(req.vendorId, req.user.companyId);
      return ok(res, invoices, 'Invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getPayments(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const payments = await vendorDashboardService.getPayments(req.vendorId, req.user.companyId);
      return ok(res, payments, 'Payments retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getNotifications(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const limit = parseInt(req.query.limit) || 20;
      const notifications = await vendorDashboardService.getNotifications(
        req.vendorId, 
        req.user.companyId, 
        limit
      );
      return ok(res, notifications, 'Notifications retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async getUnreadCount(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const count = await vendorDashboardService.getUnreadNotificationCount(req.vendorId);
      return ok(res, { unreadCount: count }, 'Unread count retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async markNotificationRead(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      await vendorDashboardService.markNotificationRead(req.params.id, req.vendorId);
      return ok(res, null, 'Notification marked as read');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

    async markAllNotificationsRead(req, res) {
    try {
      if (req.user.role === 'VENDOR' && !req.vendorId) {
        return notFound(res, 'Vendor profile not found');
      }

      const count = await vendorDashboardService.markAllNotificationsRead(req.vendorId);
      return ok(res, { markedCount: count }, 'All notifications marked as read');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new VendorDashboardController();

