
const { body, param } = require('express-validator');

const createValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['ADMIN', 'FINANCE', 'VENDOR']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

const updateValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('role').optional().isIn(['ADMIN', 'FINANCE', 'VENDOR']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

module.exports = {
  createValidation,
  updateValidation,
};
