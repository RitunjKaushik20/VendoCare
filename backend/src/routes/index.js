
const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes/authRoutes');
const userRoutes = require('../modules/users/routes/userRoutes');
const vendorRoutes = require('../modules/vendors/routes/vendorRoutes');
const vendorDashboardRoutes = require('../modules/vendors/routes/vendorDashboardRoutes');
const contractRoutes = require('../modules/contracts/routes/contractRoutes');
const invoiceRoutes = require('../modules/invoices/routes/invoiceRoutes');
const paymentRoutes = require('../modules/payments/routes/paymentRoutes');
const reportRoutes = require('../modules/reports/routes/reportRoutes');
const notificationRoutes = require('../modules/notifications/routes/notificationRoutes');
const adminDashboardRoutes = require('../modules/admin/routes/adminDashboardRoutes');
const auditRoutes = require('../modules/admin/routes/auditRoutes');
const financeDashboardRoutes = require('../modules/finance/routes/financeDashboardRoutes');


router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor/dashboard', vendorDashboardRoutes); 
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminDashboardRoutes); 
router.use('/audit', auditRoutes); 
router.use('/finance', financeDashboardRoutes); 


router.get('/', (req, res) => {
  res.json({
    name: 'VendoCare API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vendors: '/api/vendors',
      vendorDashboard: '/api/vendor/dashboard',
      contracts: '/api/contracts',
      invoices: '/api/invoices',
      payments: '/api/payments',
      reports: '/api/reports',
      notifications: '/api/notifications',
      adminDashboard: '/api/admin/dashboard',
      audit: '/api/audit',
      financeDashboard: '/api/finance/dashboard',
    },
  });
});

module.exports = router;
