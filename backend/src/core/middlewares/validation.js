
const { validationResult, body, param, query } = require('express-validator');


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages || 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
      code: 'VALIDATION_ERROR',
    });
  }
  next();
};


const validators = {
  
  email: body('email').isEmail().withMessage('Valid email is required'),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  
  name: body('name').trim().notEmpty().withMessage('Name is required'),
  
  role: body('role').optional().isIn(['ADMIN', 'FINANCE', 'VENDOR']).withMessage('Invalid role'),
  
  
  id: param('id').isUUID().withMessage('Invalid ID format'),
  
  
  page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
};

module.exports = { validate, validationResult, body, param, query, validators };
