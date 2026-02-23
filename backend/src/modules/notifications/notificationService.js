
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class NotificationService {
  
  async getAll({ page = 1, limit = 10, isRead, userId }) {
    const where = {
      ...(isRead !== undefined && { isRead }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      unreadCount,
    };
  }

  
  async create({ type, title, message, data, userId }) {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data,
      },
    });

    logger.info(`Notification created: ${type} - ${title}`);
    return notification;
  }

  
  async markAsRead(id, userId) {
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return notification;
  }

  
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return true;
  }

  
  async delete(id, userId) {
    await prisma.notification.delete({ where: { id } });
    return true;
  }

  
  async notifyContractExpiring(contract, companyId) {
    return this.create({
      type: 'CONTRACT_EXPIRING',
      title: 'Contract Expiring Soon',
      message: `Contract "${contract.title}" expires on ${contract.endDate.toLocaleDateString()}`,
      data: { contractId: contract.id },
    });
  }

  
  async notifyPaymentDue(invoice, companyId) {
    return this.create({
      type: 'PAYMENT_DUE',
      title: 'Payment Due',
      message: `Invoice ${invoice.invoiceNumber} is due on ${invoice.dueDate.toLocaleDateString()}`,
      data: { invoiceId: invoice.id, amount: invoice.totalAmount },
    });
  }

  
  async notifyPaymentReceived(payment, companyId) {
    return this.create({
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `Payment of ${payment.currency} ${payment.amount} received`,
      data: { paymentId: payment.id },
    });
  }

  
  async notifyInvoiceUploaded(invoice, companyId) {
    return this.create({
      type: 'INVOICE_UPLOADED',
      title: 'New Invoice',
      message: `New invoice ${invoice.invoiceNumber} uploaded`,
      data: { invoiceId: invoice.id },
    });
  }

  
  async notifyOverdue(invoice, companyId) {
    return this.create({
      type: 'PAYMENT_OVERDUE',
      title: 'Payment Overdue',
      message: `Invoice ${invoice.invoiceNumber} is overdue`,
      data: { invoiceId: invoice.id, amount: invoice.totalAmount },
    });
  }
}

module.exports = new NotificationService();
