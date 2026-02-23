 
const { body, param } = require('express-validator');

const createValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('gstRate').optional().isFloat({ min: 0, max: 28 }).withMessage('GST rate must be between 0 and 28'),
  body('description').optional().trim(),
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('contractId').optional().isUUID(),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('notes').optional().trim(),
];

const updateValidation = [
  param('id').isUUID().withMessage('Invalid invoice ID'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('gstRate').optional().isFloat({ min: 0, max: 28 }).withMessage('GST rate must be between 0 and 28'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().trim(),
];

const statusValidation = [
  param('id').isUUID().withMessage('Invalid invoice ID'),
  body('status').isIn(['PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED', 'REJECTED']).withMessage('Invalid status'),
];

module.exports = {
  createValidation,
  updateValidation,
  statusValidation,
};
