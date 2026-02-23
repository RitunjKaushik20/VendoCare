
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { requireAdminOrFinance, enforceCompanyIsolation } = require('../../../core/middlewares/admin');
const adminDashboardController = require('../adminDashboardController');


router.use(authenticate);
router.use(enforceCompanyIsolation());

router.get('/dashboard', requireAdminOrFinance, adminDashboardController.getDashboard.bind(adminDashboardController));

router.get('/dashboard/stats', requireAdminOrFinance, adminDashboardController.getStats.bind(adminDashboardController));

router.get('/dashboard/financials', requireAdminOrFinance, adminDashboardController.getFinancialSummary.bind(adminDashboardController));

router.get('/dashboard/outstanding-invoices', requireAdminOrFinance, adminDashboardController.getOutstandingInvoices.bind(adminDashboardController));

router.get('/dashboard/expiring-contracts', requireAdminOrFinance, adminDashboardController.getExpiringContracts.bind(adminDashboardController));

router.get('/dashboard/vendor-financials', requireAdminOrFinance, adminDashboardController.getVendorFinancials.bind(adminDashboardController));

router.get('/dashboard/vendor-financials/:vendorId', requireAdminOrFinance, adminDashboardController.getVendorFinancials.bind(adminDashboardController));

router.get('/dashboard/activities', requireAdminOrFinance, adminDashboardController.getActivities.bind(adminDashboardController));

router.get('/dashboard/monthly-spend', requireAdminOrFinance, adminDashboardController.getMonthlySpend.bind(adminDashboardController));

router.get('/dashboard/check-vendor-delete/:vendorId', requireAdminOrFinance, adminDashboardController.checkVendorDelete.bind(adminDashboardController));

module.exports = router;

