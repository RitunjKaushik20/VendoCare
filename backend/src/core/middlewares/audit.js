
const { prisma } = require('../config/database');

const auditLog = async (action, entity, entityId, oldData = null, newData = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};


const auditMiddleware = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (body) {
      
      if (res.statusCode < 400) {
        const auditData = {
          userId: req.user?.id,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
        };
        
        auditLog(action, entity, req.params.id, null, { ...req.body, ...auditData });
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

module.exports = { auditLog, auditMiddleware };
