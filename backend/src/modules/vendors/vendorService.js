
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class VendorService {

  async getAll({ page = 1, limit = 10, search, category, status, companyId }) {
    const where = {
      companyId,
      ...(status && { status }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { contracts: true, invoices: true, payments: true },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return { vendors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }


  async getById(id, companyId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
      include: {
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        contracts: {
          select: { id: true, title: true, status: true, amount: true, endDate: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, totalAmount: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        payments: {
          select: { id: true, amount: true, status: true, paymentDate: true },
          orderBy: { paymentDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    return vendor;
  }


  async create(data, companyId, createdById) {
    const bcrypt = require('bcryptjs');
    let user = await prisma.user.findUnique({ where: { email: data.email } });

    // Fix for "Email already registered":
    // Only create a user account if an account with this email DOES NOT already exist.
    // If it exists, we will link the Vendor to the existing user instead.
    if (!user) {
      const hashedPassword = await bcrypt.hash('Vendor@123', 10);
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          password: hashedPassword,
          role: 'VENDOR',
          companyId: companyId,
        }
      });
    }

    const vendor = await prisma.vendor.create({
      data: {
        ...data,
        companyId,
        createdById,
        userId: user.id,
      },
    });

    // Also update the existing user to be a VENDOR and be affiliated with this company, if not already
    // This connects their old User account up with the new vendor entity we just built.
    if (user.role !== 'VENDOR' || user.companyId !== companyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'VENDOR',
          companyId: companyId
        }
      })
    }

    const { emitToCompany } = require('../../config/socket');
    emitToCompany(companyId, 'vendor_created', vendor);

    logger.info(`Vendor created: ${vendor.name} (${vendor.id})`);
    return vendor;
  }


  async update(id, data, companyId) {
    const vendor = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data,
    });

    logger.info(`Vendor updated: ${id}`);
    return updatedVendor;
  }


  async delete(id, companyId) {
    const vendor = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { vendorId: id } });
      await tx.invoice.deleteMany({ where: { vendorId: id } });

      const vendorContracts = await tx.contract.findMany({
        where: { vendorId: id },
        select: { id: true }
      });
      const contractIds = vendorContracts.map(c => c.id);

      if (contractIds.length > 0) {
        await tx.contractDocument.deleteMany({ where: { contractId: { in: contractIds } } });
      }

      await tx.contract.deleteMany({ where: { vendorId: id } });
      await tx.vendorDocument.deleteMany({ where: { vendorId: id } });

      await tx.vendor.delete({ where: { id } });

      if (vendor.userId) {
        await tx.user.delete({ where: { id: vendor.userId } });
      }
    });
    logger.info(`Vendor deleted: ${id}`);
    return true;
  }


  async getStats(id, companyId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { contracts: true, invoices: true, payments: true },
        },
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const [totalContracts, totalInvoices, totalPayments] = await Promise.all([
      prisma.contract.aggregate({
        where: { vendorId: id },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { vendorId: id },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { vendorId: id, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      ...vendor._count,
      totalContractValue: totalContracts._sum.amount || 0,
      totalInvoiced: totalInvoices._sum.totalAmount || 0,
      totalPaid: totalPayments._sum.amount || 0,
    };
  }


  async rateVendor(id, { rating, review }, companyId) {
    const vendor = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!vendor) {
      throw new Error('Vendor not found');
    }


    const newRating = (vendor.rating * vendor.rating + rating) / (vendor.rating + 1);

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: { rating: newRating },
    });

    return updatedVendor;
  }


  async getByCategory(category, companyId) {
    return prisma.vendor.findMany({
      where: { category, companyId },
      orderBy: { rating: 'desc' },
    });
  }
}

module.exports = new VendorService();
