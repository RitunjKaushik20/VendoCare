
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class ContractService {
  
  parseDate(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return new Date(dateValue + 'T00:00:00Z');
    }
    
    return new Date(dateValue);
  }

    calculateContractStatus(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (end < today) {
      return 'EXPIRED';
    } else if (end <= sevenDaysFromNow) {
      return 'EXPIRING';
    } else {
      return 'ACTIVE';
    }
  }

    getCalculatedStatus(contract) {
    return this.calculateContractStatus(contract.endDate);
  }

    applyCalculatedStatus(contract) {
    return {
      ...contract,
      calculatedStatus: this.calculateContractStatus(contract.endDate),
    };
  }

    applyCalculatedStatusToMany(contracts) {
    return contracts.map(contract => this.applyCalculatedStatus(contract));
  }

  
  async getAll({ page = 1, limit = 10, search, status, vendorId, companyId }) {
    const where = {
      companyId,
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          _count: { select: { invoices: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    
    const contractsWithCalculatedStatus = this.applyCalculatedStatusToMany(contracts);

    return { 
      contracts: contractsWithCalculatedStatus, 
      pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
    };
  }

  
  async getById(id, companyId) {
    const contract = await prisma.contract.findFirst({
      where: { id, companyId },
      include: {
        company: { select: { id: true, name: true } },
        vendor: true,
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, totalAmount: true, dueDate: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    
    return this.applyCalculatedStatus(contract);
  }

  
  async create(data, companyId) {
    
    const vendor = await prisma.vendor.findUnique({
      where: { id: data.vendorId },
    });

    if (!vendor) {
      throw new Error('Vendor not found. Please select a valid vendor.');
    }

    
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    
    const startDate = this.parseDate(data.startDate);
    const endDate = this.parseDate(data.endDate);

    if (!startDate || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date format');
    }

    if (!endDate || isNaN(endDate.getTime())) {
      throw new Error('Invalid end date format');
    }

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    
    const initialStatus = this.calculateContractStatus(endDate);

    const contract = await prisma.contract.create({
      data: {
        title: data.title,
        description: data.description || null,
        amount: parseFloat(data.amount) || 0,
        currency: data.currency || 'INR',
        paymentCycle: data.paymentCycle || 'MONTHLY',
        startDate: startDate,
        endDate: endDate,
        autoRenew: data.autoRenew || false,
        status: initialStatus,
        terms: data.terms || null,
        companyId: companyId,
        vendorId: data.vendorId,
      },
    });

    logger.info(`Contract created: ${contract.title} (${contract.id}) with status ${initialStatus}`);
    
    
    return this.applyCalculatedStatus(contract);
  }

  
  async update(id, data, companyId) {
    const contract = await prisma.contract.findFirst({ where: { id, companyId } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    
    let updateData = { ...data };
    if (data.startDate) {
      updateData.startDate = this.parseDate(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = this.parseDate(data.endDate);
      
      updateData.status = this.calculateContractStatus(updateData.endDate);
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Contract updated: ${id}`);
    
    
    return this.applyCalculatedStatus(updatedContract);
  }

  
  async delete(id, companyId) {
    const contract = await prisma.contract.findFirst({ where: { id, companyId } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    await prisma.contract.delete({ where: { id } });
    logger.info(`Contract deleted: ${id}`);
    return true;
  }

  
  async renew(id, { endDate, amount }, companyId) {
    const contract = await prisma.contract.findFirst({ where: { id, companyId } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    const parsedEndDate = endDate ? this.parseDate(endDate) : null;
    if (parsedEndDate && parsedEndDate <= contract.endDate) {
      throw new Error('New end date must be after current end date');
    }

    
    const newEndDate = parsedEndDate || contract.endDate;
    const newStatus = this.calculateContractStatus(newEndDate);

    const renewedContract = await prisma.contract.update({
      where: { id },
      data: {
        endDate: newEndDate,
        amount: amount ? parseFloat(amount) : contract.amount,
        status: newStatus,
        autoRenew: false,
      },
    });

    logger.info(`Contract renewed: ${id} with status ${newStatus}`);
    
    
    return this.applyCalculatedStatus(renewedContract);
  }

  
  async terminate(id, companyId) {
    const contract = await prisma.contract.findFirst({ where: { id, companyId } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    const terminatedContract = await prisma.contract.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });

    logger.info(`Contract terminated: ${id}`);
    
    
    return {
      ...terminatedContract,
      calculatedStatus: 'TERMINATED',
    };
  }

  
  async getExpiring(days = 7, companyId) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const contracts = await prisma.contract.findMany({
      where: {
        companyId,
        status: { in: ['ACTIVE', 'EXPIRING'] },
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    
    return this.applyCalculatedStatusToMany(contracts);
  }

  
  async getExpired(companyId) {
    const contracts = await prisma.contract.findMany({
      where: {
        companyId,
        status: { in: ['ACTIVE', 'EXPIRING'] },
        endDate: { lt: new Date() },
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { endDate: 'desc' },
    });

    
    return this.applyCalculatedStatusToMany(contracts);
  }

  
  async getMyContracts(vendorId, companyId) {
    const contracts = await prisma.contract.findMany({
      where: {
        vendorId,
        companyId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        currency: true,
        paymentCycle: true,
        startDate: true,
        endDate: true,
        status: true,
        autoRenew: true,
        terms: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    
    return this.applyCalculatedStatusToMany(contracts);
  }

  
  async checkExpiring(companyId) {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    
    const expiringResult = await prisma.contract.updateMany({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: {
          lte: sevenDaysLater,
          gte: today,
        },
      },
      data: { status: 'EXPIRING' },
    });

    
    const expiredResult = await prisma.contract.updateMany({
      where: {
        companyId,
        status: { in: ['ACTIVE', 'EXPIRING'] },
        endDate: { lt: today },
      },
      data: { status: 'EXPIRED' },
    });

    if (expiringResult.count > 0 || expiredResult.count > 0) {
      logger.info(`Contract expiry check: ${expiringResult.count} expiring, ${expiredResult.count} expired`);
    }

    return {
      expiring: expiringResult.count,
      expired: expiredResult.count,
    };
  }
}

module.exports = new ContractService();
