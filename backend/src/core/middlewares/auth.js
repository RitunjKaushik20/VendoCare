
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/database');
const config = require('../../config');
const { deriveVendorId } = require('./vendor');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret);

    
    const includeOptions = {
      company: true,
    };

    
    if (decoded.role === 'VENDOR') {
      includeOptions.vendor = {
        select: { id: true, status: true, companyId: true }
      };
      includeOptions.createdVendors = {
        select: { id: true, status: true, companyId: true }
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: includeOptions,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        code: 'INVALID_TOKEN',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    
    if (user.role === 'VENDOR') {
      if (user.vendor) {
        user.vendorId = user.vendor.id;
        user.vendorStatus = user.vendor.status;
        user.vendorCompanyId = user.vendor.companyId;
      } else if (user.createdVendors && user.createdVendors.length > 0) {
        user.vendorId = user.createdVendors[0].id;
        user.vendorStatus = user.createdVendors[0].status;
        user.vendorCompanyId = user.createdVendors[0].companyId;
      }
    }

    
    if (decoded.companyId) {
      user.companyId = decoded.companyId;
    }

    
    if (user.role === 'VENDOR' && user.vendorCompanyId) {
      user.companyId = user.vendorCompanyId;
    }

    
    if (!user.companyId && user.company && user.company.id) {
      user.companyId = user.company.id;
    }

    
    if (user.company) {
      user.company = user.company;
    }

    req.user = user;
    req.token = token;

    
    if (user.role === 'VENDOR') {
      await deriveVendorId(req, res, () => { });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_ERROR',
    });
  }
};

module.exports = { authenticate };

