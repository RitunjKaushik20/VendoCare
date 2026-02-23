
const rateLimit = require('express-rate-limit');
const config = require('../../config');


const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


const authLimiter = (req, res, next) => next();

module.exports = { apiLimiter, authLimiter };
