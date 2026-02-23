
const PERMISSIONS = {
  
  'users:create': ['ADMIN'],
  'users:read': ['ADMIN', 'FINANCE'],
  'users:update': ['ADMIN'],
  'users:delete': ['ADMIN'],
  
  
  'vendors:create': ['ADMIN', 'FINANCE'],
  'vendors:read': ['ADMIN', 'FINANCE', 'VENDOR'],
  'vendors:update': ['ADMIN', 'FINANCE'],
  'vendors:delete': ['ADMIN'],
  
  
  'contracts:create': ['ADMIN', 'FINANCE'],
  'contracts:read': ['ADMIN', 'FINANCE', 'VENDOR'],
  'contracts:update': ['ADMIN', 'FINANCE'],
  'contracts:delete': ['ADMIN'],
  
  
  'invoices:create': ['ADMIN', 'FINANCE', 'VENDOR'],
  'invoices:read': ['ADMIN', 'FINANCE', 'VENDOR'],
  'invoices:update': ['ADMIN', 'FINANCE'],
  'invoices:delete': ['ADMIN', 'FINANCE'],
  
  
  'payments:create': ['ADMIN', 'FINANCE'],
  'payments:read': ['ADMIN', 'FINANCE', 'VENDOR'],
  'payments:update': ['ADMIN', 'FINANCE'],
  'payments:refund': ['ADMIN'],
  
  
  'reports:read': ['ADMIN', 'FINANCE'],
  'reports:export': ['ADMIN', 'FINANCE'],
};

const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    
    const hasPermission = requiredPermissions.some(permission => {
      const allowedRoles = PERMISSIONS[permission];
      return allowedRoles && allowedRoles.includes(userRole);
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Role not authorized.',
        code: 'FORBIDDEN',
      });
    }
    next();
  };
};

module.exports = { authorize, authorizeRoles, PERMISSIONS };
