
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class AuditService {
    async createLog(data) {
    const {
      action,
      entity,
      entityId,
      oldData = null,
      newData = null,
      userId,
      userName,
      ipAddress,
      userAgent,
      companyId,
      metadata = null,
    } = data;

    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
          userId,
          userName,
          ipAddress,
          userAgent,
          companyId,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        },
      });

      logger.info(`Audit log created: ${action} ${entity} ${entityId}`);
      return auditLog;
    } catch (error) {
      logger.error('Audit log creation error:', error);
      throw error;
    }
  }

    async logVendorAction(req, action, vendorId, oldVendor = null, newVendor = null) {
    return this.createLog({
      action,
      entity: 'VENDOR',
      entityId: vendorId,
      oldData: oldVendor,
      newData: newVendor,
      userId: req.user.id,
      userName: req.user.name,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      companyId: req.user.companyId,
    });
  }

    async logContractAction(req, action, contractId, oldContract = null, newContract = null) {
    return this.createLog({
      action,
      entity: 'CONTRACT',
      entityId: contractId,
      oldData: oldContract,
      newData: newContract,
      userId: req.user.id,
      userName: req.user.name,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      companyId: req.user.companyId,
    });
  }

    async logInvoiceAction(req, action, invoiceId, oldInvoice = null, newInvoice = null) {
    return this.createLog({
      action,
      entity: 'INVOICE',
      entityId: invoiceId,
      oldData: oldInvoice,
      newData: newInvoice,
      userId: req.user.id,
      userName: req.user.name,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      companyId: req.user.companyId,
    });
  }

    async logPaymentAction(req, action, paymentId, oldPayment = null, newPayment = null) {
    return this.createLog({
      action,
      entity: 'PAYMENT',
      entityId: paymentId,
      oldData: oldPayment,
      newData: newPayment,
      userId: req.user.id,
      userName: req.user.name,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      companyId: req.user.companyId,
    });
  }

    async logUserAction(req, action, userId, oldUser = null, newUser = null) {
    return this.createLog({
      action,
      entity: 'USER',
      entityId: userId,
      oldData: oldUser ? { ...oldUser, password: '[REDACTED]' } : null,
      newData: newUser ? { ...newUser, password: '[REDACTED]' } : null,
      userId: req.user.id,
      userName: req.user.name,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      companyId: req.user.companyId,
    });
  }

    async getLogs(companyId, options = {}) {
    const {
      page = 1,
      limit = 50,
      entity = null,
      action = null,
      userId = null,
      startDate = null,
      endDate = null,
    } = options;

    const where = {
      companyId,
      ...(entity && { entity }),
      ...(action && { action }),
      ...(userId && { userId }),
      ...(startDate || endDate && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

    async getEntityLogs(companyId, entity, entityId) {
    return prisma.auditLog.findMany({
      where: {
        companyId,
        entity,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

    async getUserLogs(companyId, userId, limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        companyId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

    async getStats(companyId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [byAction, byEntity, recentActivity] = await Promise.all([
      
      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          companyId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      
      prisma.auditLog.groupBy({
        by: ['entity'],
        where: {
          companyId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      
      prisma.auditLog.count({
        where: {
          companyId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      totalActions: recentActivity,
      byAction: byAction.reduce((acc, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {}),
      byEntity: byEntity.reduce((acc, item) => {
        acc[item.entity] = item._count;
        return acc;
      }, {}),
      period: `${days} days`,
    };
  }
}

module.exports = new AuditService();

