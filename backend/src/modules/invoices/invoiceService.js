
const logger = require('../../core/utils/logger');
const { emitInvoiceStatusChange, emitNewInvoice } = require('../../config/socket');

const { prisma } = require('../../config/database');

class InvoiceService {
  
  
  
  
  static STATUS_LIFECYCLE = ['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'OVERDUE'];

    isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'PENDING': ['APPROVED', 'REJECTED'],
      'APPROVED': ['PAID', 'REJECTED'],
      'PAID': [],
      'REJECTED': [],
      'OVERDUE': ['PAID', 'REJECTED'],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  
  async getAll({ page = 1, limit = 10, search, status, vendorId, companyId }) {
    const where = {
      companyId,
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          contract: { select: { id: true, title: true } },
          payment: { select: { id: true, status: true, amount: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  
  async getById(id, companyId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        company: { select: { id: true, name: true } },
        vendor: true,
        contract: true,
        payment: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  
  async create(data, companyId) {
    
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${timestamp}-${randomSuffix}`;

    
    const gstRate = data.gstRate || 18;
    const amount = parseFloat(data.amount) || 0;
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        amount: amount,
        gstRate: gstRate,
        gstAmount: gstAmount,
        totalAmount: totalAmount,
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        status: 'PENDING',
        fileUrl: data.fileUrl || null,
        filePublicId: data.filePublicId || null,
        notes: data.notes || null,
        company: { connect: { id: companyId } },
        vendor: { connect: { id: data.vendorId } },
        ...(data.contractId ? { contract: { connect: { id: data.contractId } } } : {}),
      },
    });

    logger.info(`Invoice created: ${invoiceNumber} with status PENDING`);

    
    try {
      emitNewInvoice({
        companyId,
        vendorId: data.vendorId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: totalAmount,
      });
    } catch (socketError) {
      console.error('Failed to emit new invoice socket event:', socketError.message);
    }

    return invoice;
  }

  
  async update(id, data, companyId) {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    
    const allowedUpdates = ['description', 'dueDate', 'notes', 'fileUrl', 'contractId'];
    const updateData = {};

    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = data[key];
      }
    });

    
    let gstAmount = invoice.gstAmount;
    let totalAmount = invoice.totalAmount;

    if (data.amount || data.gstRate) {
      const amount = data.amount || invoice.amount;
      const gstRate = data.gstRate || invoice.gstRate;
      gstAmount = (amount * gstRate) / 100;
      totalAmount = amount + gstAmount;
      updateData.amount = amount;
      updateData.gstRate = gstRate;
      updateData.gstAmount = gstAmount;
      updateData.totalAmount = totalAmount;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Invoice updated: ${invoice.invoiceNumber}`);
    return updatedInvoice;
  }

  
  async delete(id, companyId) {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    await prisma.invoice.delete({ where: { id } });
    logger.info(`Invoice deleted: ${invoice.invoiceNumber}`);
    return true;
  }

  
  async updateStatus(id, status, companyId, notes = null) {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    
    if (!this.isValidStatusTransition(invoice.status, status)) {
      throw new Error(`Invalid status transition from ${invoice.status} to ${status}`);
    }

    const updateData = { status };
    if (status === 'PAID') {
      updateData.paidDate = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Invoice status updated: ${invoice.invoiceNumber} -> ${status}`);

    
    try {
      emitInvoiceStatusChange({
        vendorId: invoice.vendorId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        oldStatus: invoice.status,
        newStatus: status,
        reason: notes,
      });
    } catch (socketError) {
      console.error('Failed to emit invoice status change socket event:', socketError.message);
    }

    return updatedInvoice;
  }

    async approveInvoice(id, companyId, notes = null) {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'PENDING') {
      throw new Error(`Cannot approve invoice with status ${invoice.status}. Only PENDING invoices can be approved.`);
    }

    const updateData = {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: null, 
    };

    if (notes) {
      updateData.notes = notes;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Invoice approved: ${invoice.invoiceNumber}`);
    return updatedInvoice;
  }

    async rejectInvoice(id, reason, companyId) {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!['PENDING', 'APPROVED'].includes(invoice.status)) {
      throw new Error(`Cannot reject invoice with status ${invoice.status}`);
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        notes: reason ? `${invoice.notes || ''}\n\nRejection reason: ${reason}`.trim() : invoice.notes,
      },
    });

    logger.info(`Invoice rejected: ${invoice.invoiceNumber}. Reason: ${reason}`);
    return updatedInvoice;
  }

  
  async getPending(companyId) {
    return prisma.invoice.findMany({
      where: { companyId, status: 'PENDING' },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  
  async getApproved(companyId) {
    return prisma.invoice.findMany({
      where: { companyId, status: 'APPROVED' },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { approvedAt: 'desc' },
    });
  }

  
  async getOverdue(companyId) {
    return prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['PENDING', 'APPROVED'] },
        dueDate: { lt: new Date() },
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  
  async getMyInvoices(vendorId, companyId) {
    const invoices = await prisma.invoice.findMany({
      where: { vendorId, companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        gstRate: true,
        gstAmount: true,
        totalAmount: true,
        description: true,
        status: true,
        dueDate: true,
        issueDate: true,
        paidDate: true,
        fileUrl: true,
        notes: true,
        contractId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return invoices.map(invoice => ({
      ...invoice,
      dueDate: invoice.dueDate?.toISOString(),
      issueDate: invoice.issueDate?.toISOString(),
      paidDate: invoice.paidDate?.toISOString(),
      createdAt: invoice.createdAt?.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString(),
    }));
  }

  
  async checkOverdue(companyId) {
    const result = await prisma.invoice.updateMany({
      where: {
        companyId,
        status: { in: ['PENDING', 'APPROVED'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });

    if (result.count > 0) {
      logger.info(`Updated ${result.count} invoices to OVERDUE status`);
    }

    return result.count;
  }

  
  async uploadWithFile(data, file, companyId) {
    const { cloudinaryUrl, cloudinaryPublicId } = file;

    const invoice = await this.create(
      { ...data, fileUrl: cloudinaryUrl, filePublicId: cloudinaryPublicId },
      companyId
    );

    return invoice;
  }

  
  async getStats(companyId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pending, approved, overdue, paidThisMonth, totalPending, totalApproved, totalOverdue] = await Promise.all([
      prisma.invoice.count({ where: { companyId, status: 'PENDING' } }),
      prisma.invoice.count({ where: { companyId, status: 'APPROVED' } }),
      prisma.invoice.count({ where: { companyId, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: 'PAID',
          paidDate: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, status: 'APPROVED' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, status: 'OVERDUE' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      pendingCount: pending,
      approvedCount: approved,
      overdueCount: overdue,
      paidThisMonth: paidThisMonth._sum.totalAmount || 0,
      totalPending: totalPending._sum.totalAmount || 0,
      totalApproved: totalApproved._sum.totalAmount || 0,
      totalOverdue: totalOverdue._sum.totalAmount || 0,
    };
  }

  
  async sendReminder(id, companyId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Cannot send reminder for paid invoice');
    }

    
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { reminderSentAt: new Date() },
    });

    logger.info(`Payment reminder sent for invoice: ${invoice.invoiceNumber} to ${invoice.vendor.email}`);
    return { invoice: updatedInvoice, vendor: invoice.vendor };
  }
}

module.exports = new InvoiceService();
