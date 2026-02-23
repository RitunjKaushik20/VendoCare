
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { authorizeRoles } = require('../../../core/middlewares/role');
const { deriveVendorId } = require('../../../core/middlewares/vendor');
const { validate } = require('../../../core/middlewares/validation');
const paymentController = require('../paymentController');
const paymentService = require('../paymentService');
const razorpayWebhook = require('../razorpay/razorpayWebhook');
const {
  createValidation,
  updateValidation,
  processValidation,
  refundValidation,
  razorpayValidation,
} = require('../paymentValidator');


router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);


router.use(authenticate);
router.use(deriveVendorId);


const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
router.use(enforceCompanyIsolation());


router.get('/my', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    if (!req.vendorId) {
      return res.status(404).json({
        success: false,
        message: 'No vendor profile found for this user',
      });
    }
    
    const payments = await paymentService.getByVendor(req.vendorId, req.user.companyId);
    
    return res.status(200).json({
      success: true,
      data: { payments },
      message: 'Vendor payments retrieved',
    });
  } catch (error) {
    console.error('Error fetching vendor payments:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get('/', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), paymentController.getAll);
router.get('/:id', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), paymentController.getById);
router.post('/', authorizeRoles('ADMIN', 'FINANCE'), createValidation, validate, paymentController.create);
router.put('/:id', authorizeRoles('ADMIN', 'FINANCE'), updateValidation, validate, paymentController.updateStatus);
router.delete('/:id', authorizeRoles('ADMIN', 'FINANCE'), paymentController.delete);
router.post('/refund/:id', authorizeRoles('ADMIN'), refundValidation, validate, paymentController.refund);


router.post('/razorpay/initiate', authorizeRoles('ADMIN', 'FINANCE'), razorpayValidation, validate, paymentController.initiateRazorpay);
router.post('/razorpay/verify', authorizeRoles('ADMIN', 'FINANCE'), razorpayValidation, validate, paymentController.verifyRazorpay);


router.get('/vendor/:vendorId', authorizeRoles('ADMIN', 'FINANCE'), paymentController.getByVendor);
router.get('/invoice/:invoiceId', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), paymentController.getByInvoice);
router.get('/history', authorizeRoles('ADMIN', 'FINANCE'), paymentController.getHistory);
router.get('/stats', authorizeRoles('ADMIN', 'FINANCE'), paymentController.getStats);

module.exports = router;
