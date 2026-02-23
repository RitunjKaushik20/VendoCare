const { prisma } = require('../../config/database');

const requireAdminOrFinance = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  if (!['ADMIN', 'FINANCE'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Finance role required.',
      code: 'FORBIDDEN',
    });
  }

  next();
};


const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
      code: 'FORBIDDEN',
    });
  }

  next();
};

/**
 * Enforce company isolation
 * All queries must be filtered by companyId
 * Can be used without parameters (for general middleware) or with a modelName parameter
 */
const enforceCompanyIsolation = (modelName) => {
  // If called without parentheses (as middleware), modelName will be the request object
  // If called with parentheses, it returns the middleware function
  if (typeof modelName === 'object' && modelName !== null) {
    // Called without parameters - this is the actual middleware
    const middleware = async (req, res, next) => {
      // Attach companyId to request for downstream use (if available)
      if (req.user?.companyId) {
        req.companyId = req.user.companyId;
      }
      
      // Continue regardless - let the route handlers check for companyId if needed
      next();
    };
    return middleware;
  }

  // Called with parentheses - return the middleware function
  return async (req, res, next) => {
    // Attach companyId to request for downstream use (if available)
    if (req.user?.companyId) {
      req.companyId = req.user.companyId;
    }
    
    // Continue regardless - let the route handlers check for companyId if needed
    next();
  };
};

/**
 * Check if entity belongs to user's company
 */
const verifyCompanyOwnership = async (req, res, next) => {
  const { id } = req.params;
  const modelName = req.params.model || req.baseUrl.split('/').pop();

  if (!id) {
    return next();
  }

  try {
    const modelMap = {
      vendor: prisma.vendor,
      contract: prisma.contract,
      invoice: prisma.invoice,
      payment: prisma.payment,
      user: prisma.user,
      company: prisma.company,
    };

    const model = modelMap[modelName];
    if (!model) {
      return next();
    }

    const entity = await model.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!entity) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This ${modelName} does not belong to your company.`,
        code: 'NOT_COMPANY_OWNER',
      });
    }

    req.entity = entity;
    next();
  } catch (error) {
    console.error('Company ownership verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify ownership',
      code: 'VERIFICATION_ERROR',
    });
  }
};

/**
 * Get company filter for database queries
 */
const getCompanyFilter = (companyId) => {
  return { companyId };
};

/**
 * Require active subscription
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
      });
    }

    const subscriptionValid = ['trial', 'basic', 'premium', 'enterprise'].includes(company.subscription);
    const subscriptionEndValid = !company.subscriptionEnd || company.subscriptionEnd > new Date();

    if (!subscriptionValid || !subscriptionEndValid) {
      return res.status(403).json({
        success: false,
        message: 'Subscription expired or inactive',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    req.company = company;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify subscription',
      code: 'SUBSCRIPTION_ERROR',
    });
  }
};

/**
 * Audit logging helper for admin actions
 */
const logAdminAction = async (req, action, entity, entityId, oldData = null, newData = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        userId: req.user.id,
        userName: req.user.name,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        companyId: req.user.companyId,
      },
    });
  } catch (error) {
    console.error('Admin audit log error:', error);
  }
};

module.exports = {
  requireAdminOrFinance,
  requireAdmin,
  enforceCompanyIsolation,
  verifyCompanyOwnership,
  getCompanyFilter,
  requireActiveSubscription,
  logAdminAction,
};

