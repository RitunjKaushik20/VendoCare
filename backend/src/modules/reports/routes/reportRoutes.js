
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { authorizeRoles } = require('../../../core/middlewares/role');
const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
const reportController = require('../reportController');

router.use(authenticate);
router.use(enforceCompanyIsolation());


router.get('/dashboard', reportController.getDashboardStats);


router.get('/activities', reportController.getRecentActivities);


router.get('/spending', authorizeRoles('ADMIN', 'FINANCE'), reportController.getSpendingReport);
router.get('/overdue', authorizeRoles('ADMIN', 'FINANCE'), reportController.getOverdueReport);
router.get('/taxes', authorizeRoles('ADMIN', 'FINANCE'), reportController.getTaxReport);
router.get('/vendor-wise', authorizeRoles('ADMIN', 'FINANCE'), reportController.getVendorWiseReport);
router.get('/contract-wise', authorizeRoles('ADMIN', 'FINANCE'), reportController.getContractWiseReport);
router.get('/export/csv/:type', authorizeRoles('ADMIN', 'FINANCE'), reportController.exportCsv);

module.exports = router;
