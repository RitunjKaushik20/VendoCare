
const cron = require('node-cron');
const notificationService = require('../modules/notifications/notificationService');
const emailTemplates = require('../templates/email/emailTemplates');
const logger = require('../core/utils/logger');

const { prisma } = require('../config/database');

class Jobs {
  constructor() {
    this.jobs = [];
  }

  
  init() {
    
    this.jobs.push(
      cron.schedule('0 9 * * *', async () => {
        logger.info('Running contract expiry check job');
        await this.checkContractExpiry();
      })
    );

    
    this.jobs.push(
      cron.schedule('0 10 * * *', async () => {
        logger.info('Running overdue invoice check job');
        await this.checkOverdueInvoices();
      })
    );

    
    this.jobs.push(
      cron.schedule('0 * * * *', async () => {
        logger.info('Running invoice status update job');
        await this.updateInvoiceStatuses();
      })
    );

    
    this.jobs.push(
      cron.schedule('0 0 * * 0', async () => {
        logger.info('Running log cleanup job');
        await this.cleanupOldLogs();
      })
    );

    logger.info('Scheduled jobs initialized');
  }

  
  async checkContractExpiry() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysFromNow,
          gte: now,
        },
      },
      include: {
        vendor: true,
        company: true,
      },
    });

    for (const contract of expiringContracts) {
      
      await notificationService.notifyContractExpiring(contract, contract.companyId);

      
      try {
        await emailTemplates.sendContractExpiryNotification(contract.vendor, contract);
      } catch (error) {
        logger.error(`Failed to send contract expiry email: ${error.message}`);
      }
    }

    logger.info(`Contract expiry check: ${expiringContracts.length} contracts expiring soon`);
  }

  
  async checkOverdueInvoices() {
    const now = new Date();

    
    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    if (overdueInvoices.count > 0) {
      
      const invoices = await prisma.invoice.findMany({
        where: {
          status: 'OVERDUE',
          dueDate: {
            lt: now,
          },
        },
        include: {
          vendor: true,
          company: true,
        },
      });

      for (const invoice of invoices) {
        await notificationService.notifyOverdue(invoice, invoice.companyId);
      }

      logger.info(`Overdue invoice check: ${invoices.length} invoices marked as overdue`);
    }
  }

  
  async updateInvoiceStatuses() {
    const now = new Date();

    
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        payment: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    for (const invoice of paidInvoices) {
      if (invoice.payment && invoice.payment.length > 0) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paidDate: invoice.payment[0].paymentDate,
          },
        });
      }
    }

    logger.info(`Invoice status update: ${paidInvoices.length} invoices updated`);
  }

  
  async cleanupOldLogs() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deletedLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Log cleanup: ${deletedLogs.count} old audit logs deleted`);
  }

  
  stop() {
    this.jobs.forEach((job) => job.stop());
    logger.info('Scheduled jobs stopped');
  }
}

module.exports = new Jobs();
