
const { body, param } = require('express-validator');


const isValidDate = (value) => {
  
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return true;
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};

const createValidation = [
  body('title').trim().notEmpty().withMessage('Contract title is required'),
  body('description').optional().trim(),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('currency').optional().default('INR'),
  body('paymentCycle').isIn(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME']).withMessage('Invalid payment cycle'),
  body('startDate')
    .custom((value) => {
      if (!isValidDate(value)) {
        throw new Error('Valid start date is required (YYYY-MM-DD or ISO8601)');
      }
      return true;
    }),
  body('endDate')
    .custom((value) => {
      if (!isValidDate(value)) {
        throw new Error('Valid end date is required (YYYY-MM-DD or ISO8601)');
      }
      return true;
    }),
  body('vendorId').isUUID().withMessage('Valid vendor ID is required'),
  body('autoRenew').optional().isBoolean(),
  body('terms').optional().trim(),
];

const updateValidation = [
  param('id').isUUID().withMessage('Invalid contract ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('status').optional().isIn(['ACTIVE', 'EXPIRED', 'EXPIRING', 'PENDING', 'TERMINATED']),
  body('autoRenew').optional().isBoolean(),
  body('terms').optional().trim(),
];

const renewValidation = [
  param('id').isUUID().withMessage('Invalid contract ID'),
  body('endDate')
    .optional()
    .custom((value) => {
      if (value && !isValidDate(value)) {
        throw new Error('Valid end date is required (YYYY-MM-DD or ISO8601)');
      }
      return true;
    }),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
];

module.exports = {
  createValidation,
  updateValidation,
  renewValidation,
};
