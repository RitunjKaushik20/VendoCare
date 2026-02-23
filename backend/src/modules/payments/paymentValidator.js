
const { body, param } = require('express-validator');

const createValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('currency').optional().default('INR'),
  body('method').isIn(['BANK_TRANSFER', 'UPI', 'CHECK', 'CASH', 'CARD', 'WALLET', 'ONLINE']).withMessage('Invalid payment method'),
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('invoiceId').isUUID().withMessage('Valid invoice ID is required'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  body('notes').optional().trim(),
];

const updateValidation = [
  param('id').isUUID().withMessage('Invalid payment ID'),
  body('status').isIn(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).withMessage('Invalid status'),
  body('notes').optional().trim(),
];

const razorpayValidation = [
  body('invoiceId').optional().isUUID().withMessage('Invalid invoice ID'),
  body('paymentId').optional().isUUID().withMessage('Invalid payment ID'),
  body('razorpayOrderId').optional().isString().withMessage('Invalid Razorpay order ID'),
  body('razorpayPaymentId').optional().isString().withMessage('Invalid Razorpay payment ID'),
  body('razorpaySignature').optional().isString().withMessage('Invalid Razorpay signature'),
];

const refundValidation = [
  param('id').isUUID().withMessage('Invalid payment ID'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
  body('reason').trim().notEmpty().withMessage('Refund reason is required'),
];

module.exports = {
  createValidation,
  updateValidation,
  razorpayValidation,
  refundValidation,
};
