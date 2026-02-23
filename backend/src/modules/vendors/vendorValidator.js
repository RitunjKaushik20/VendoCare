
const { body, param } = require('express-validator');

const createValidation = [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('country').optional().default('India'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('gstNumber').optional().trim(),
  body('panNumber').optional().trim(),
  body('bankName').optional().trim(),
  body('bankAccount').optional().trim(),
  body('ifscCode').optional().trim(),
];

const updateValidation = [
  param('id').isUUID().withMessage('Invalid vendor ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']),
  body('category').optional().trim(),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('gstNumber').optional().trim(),
  body('panNumber').optional().trim(),
  body('bankName').optional().trim(),
  body('bankAccount').optional().trim(),
  body('ifscCode').optional().trim(),
];

const rateValidation = [
  param('id').isUUID().withMessage('Invalid vendor ID'),
  body('rating').isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('review').optional().trim(),
];

module.exports = {
  createValidation,
  updateValidation,
  rateValidation,
};
