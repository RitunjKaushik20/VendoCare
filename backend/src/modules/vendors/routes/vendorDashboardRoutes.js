
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { authorizeRoles } = require('../../../core/middlewares/role');
const { deriveVendorId, enforceVendorIsolation } = require('../../../core/middlewares/vendor');
const vendorDashboardController = require('../vendorDashboardController');


router.use(authenticate);
router.use(deriveVendorId);


const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
router.use(enforceCompanyIsolation());
router.use(enforceVendorIsolation);





router.get('/', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const dashboard = await require('../vendorDashboardService').getDashboardData(
      req.vendorId,
      req.vendorCompanyId || req.user.companyId
    );
    return res.status(200).json({
      success: true,
      data: dashboard,
      message: 'Dashboard data retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/stats', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const stats = await require('../vendorDashboardService').getOverviewStats(
      req.vendorId,
      req.vendorCompanyId || req.user.companyId
    );
    return res.status(200).json({
      success: true,
      data: stats,
      message: 'Stats retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/contracts', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const contracts = await require('../vendorDashboardService').getContracts(
      req.vendorId,
      req.vendorCompanyId || req.user.companyId
    );
    return res.status(200).json({
      success: true,
      data: contracts,
      message: 'Contracts retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/invoices', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const invoices = await require('../vendorDashboardService').getInvoices(
      req.vendorId,
      req.vendorCompanyId || req.user.companyId
    );
    return res.status(200).json({
      success: true,
      data: invoices,
      message: 'Invoices retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/payments', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const payments = await require('../vendorDashboardService').getPayments(
      req.vendorId,
      req.vendorCompanyId || req.user.companyId
    );
    return res.status(200).json({
      success: true,
      data: payments,
      message: 'Payments retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});





router.get('/notifications', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await require('../vendorDashboardService').getNotifications(
      req.vendorId,
      req.vendorCompanyId || req.user.companyId,
      limit
    );
    return res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/notifications/unread-count', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const count = await require('../vendorDashboardService').getUnreadNotificationCount(req.vendorId);
    return res.status(200).json({
      success: true,
      data: { unreadCount: count },
      message: 'Unread count retrieved',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.put('/notifications/:id/read', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    await require('../vendorDashboardService').markNotificationRead(req.params.id, req.vendorId);
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Notification marked as read',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.put('/notifications/read-all', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const count = await require('../vendorDashboardService').markAllNotificationsRead(req.vendorId);
    return res.status(200).json({
      success: true,
      data: { markedCount: count },
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});





router.get('/live-stats', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    const { prisma } = require('../../../config/database');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    
    const [pendingInvoices, overdueCount, paidThisMonth, activeContracts] = await Promise.all([
      prisma.invoice.aggregate({
        where: { vendorId: req.vendorId, status: 'PENDING' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.count({
        where: { vendorId: req.vendorId, status: 'OVERDUE' },
      }),
      prisma.payment.aggregate({
        where: {
          vendorId: req.vendorId,
          status: 'COMPLETED',
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.contract.count({
        where: { vendorId: req.vendorId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingInvoices: pendingInvoices._count || 0,
        pendingAmount: pendingInvoices._sum.totalAmount || 0,
        overdueCount,
        paidThisMonth: paidThisMonth._sum.amount || 0,
        activeContracts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

