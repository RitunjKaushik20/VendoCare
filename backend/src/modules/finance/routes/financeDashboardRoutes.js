
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { requireFinance, enforceFinanceFilters, preventDuplicatePayment } = require('../../../core/middlewares/finance');
const financeDashboardController = require('../financeDashboardController');


router.use(authenticate);
router.use(enforceFinanceFilters);


const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
router.use(enforceCompanyIsolation());

router.get('/dashboard', requireFinance, financeDashboardController.getDashboard.bind(financeDashboardController));

router.get('/dashboard/stats', requireFinance, financeDashboardController.getLiveStats.bind(financeDashboardController));

router.get('/payable-queue', requireFinance, financeDashboardController.getPayableQueue.bind(financeDashboardController));

router.get('/overdue-invoices', requireFinance, financeDashboardController.getOverdueInvoices.bind(financeDashboardController));

router.get('/aging-analysis', requireFinance, financeDashboardController.getAgingAnalysis.bind(financeDashboardController));

router.get('/vendor-ledger', requireFinance, financeDashboardController.getVendorLedger.bind(financeDashboardController));

router.get('/vendor-ledger/:vendorId', requireFinance, financeDashboardController.getVendorLedger.bind(financeDashboardController));

router.get('/payments/recent', requireFinance, financeDashboardController.getRecentPayments.bind(financeDashboardController));

router.get('/payments/history', requireFinance, financeDashboardController.getPaymentHistory.bind(financeDashboardController));

router.get('/monthly-spend', requireFinance, financeDashboardController.getMonthlySpend.bind(financeDashboardController));

router.get('/gst-summary', requireFinance, financeDashboardController.getGstSummary.bind(financeDashboardController));

router.get('/total-outstanding', requireFinance, financeDashboardController.getTotalOutstanding.bind(financeDashboardController));

router.post(
  '/payments/process/:invoiceId',
  requireFinance,
  preventDuplicatePayment,
  financeDashboardController.processPayment.bind(financeDashboardController)
);

module.exports = router;

