
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { authorizeRoles } = require('../../../core/middlewares/role');
const { validate } = require('../../../core/middlewares/validation');
const { deriveVendorId, enforceVendorIsolation, requireActiveVendor, getVendorFilter } = require('../../../core/middlewares/vendor');
const vendorController = require('../vendorController');
const { createValidation, updateValidation, rateValidation } = require('../vendorValidator');


router.use(authenticate);
router.use(deriveVendorId);


const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
router.use(enforceCompanyIsolation());


router.get('/me', async (req, res) => {
  try {
    const { prisma } = require('../../../config/database');

    let vendor;

    if (req.user.role === 'VENDOR') {

      if (!req.vendorId) {
        return res.status(404).json({
          success: false,
          message: 'No vendor profile found for this user',
        });
      }
      vendor = await prisma.vendor.findUnique({
        where: { id: req.vendorId },
        include: {
          company: { select: { id: true, name: true, logo: true } },
          _count: {
            select: { contracts: true, invoices: true, payments: true },
          },
        },
      });
    } else {

      const vendorId = req.query.id;
      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor ID is required',
        });
      }
      vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          company: { select: { id: true, name: true, logo: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: {
            select: { contracts: true, invoices: true, payments: true },
          },
        },
      });
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor profile',
    });
  }
});


router.get('/', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), async (req, res) => {
  try {
    console.log('=== GET Vendors Request ===');
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    console.log('User companyId:', req.user?.companyId);
    console.log('User company:', req.user?.company);
    console.log('Query:', JSON.stringify(req.query));
    console.log('============================');


    const companyId = req.user.companyId || req.user?.company?.id;

    if (!companyId) {
      console.error('No companyId found for user:', req.user?.email);
      return res.status(400).json({
        success: false,
        message: 'User is not associated with a company. Please contact administrator.',
      });
    }

    const { page, limit, search, category, status } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;


    let vendorId = null;
    if (req.user.role === 'VENDOR') {
      vendorId = req.vendorId;
    }

    const { prisma } = require('../../../config/database');

    const where = {

      ...(req.user.role === 'VENDOR' ? { id: vendorId } : { companyId: companyId }),
      ...(status && { status }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

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

    return res.status(200).json({
      success: true,
      data: {
        vendors,
        pagination: { page: parseInt(page) || 1, limit: take, total, pages: Math.ceil(total / take) },
      },
      message: 'Vendors retrieved',
    });
  } catch (error) {
    console.error('=== GET Vendors Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================');
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendors. Please try again later.',
    });
  }
});

router.get('/:id', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), enforceVendorIsolation, async (req, res) => {
  try {

    const companyId = req.user.companyId || req.user?.company?.id;

    const { prisma } = require('../../../config/database');


    const where = {
      id: req.params.id,
      ...(req.user.role === 'VENDOR' ? {} : { companyId: companyId }),
    };

    const vendor = await prisma.vendor.findFirst({
      where,
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
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { vendor },
      message: 'Vendor retrieved',
    });
  } catch (error) {
    console.error('Error in GET /:id:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.post('/', authorizeRoles('ADMIN', 'FINANCE'), createValidation, validate, async (req, res) => {
  try {
    console.log('=== Vendor Creation Request ===');
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    console.log('User companyId:', req.user?.companyId);
    console.log('User company:', req.user?.company);
    console.log('Body:', JSON.stringify(req.body));
    console.log('================================');


    const companyId = req.user.companyId || req.user?.company?.id;

    if (!companyId) {
      console.error('No companyId found for user:', req.user?.email);
      return res.status(400).json({
        success: false,
        message: 'User is not associated with a company. Please contact administrator.',
      });
    }

    const { prisma } = require('../../../config/database');


    const existingVendor = await prisma.vendor.findUnique({
      where: { email: req.body.email },
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'A vendor with this email already exists. Please use a different email or update the existing vendor.',
      });
    }

    const bcrypt = require('bcryptjs');
    const { getIO } = require('../../../config/socket');


    let vendorUser = await prisma.user.findUnique({
      where: { email: req.body.email }
    });

    const vendorData = {
      ...req.body,
      companyId: companyId,
      createdById: req.user.id,
    };

    if (vendorUser) {
      vendorData.userId = vendorUser.id;
    }

    const vendor = await prisma.vendor.create({
      data: vendorData,
      include: {
        _count: {
          select: { contracts: true, invoices: true, payments: true },
        },
      }
    });

    try {
      const io = getIO();
      io.to(`company:${companyId}`).emit('vendor_created', vendor);
    } catch (socketErr) {
      console.log('Socket emit failed:', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      data: { vendor },
      message: 'Vendor created',
    });
  } catch (error) {
    console.error('=== Vendor Creation Error ===');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('===========================');
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


router.put('/:id', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), enforceVendorIsolation, updateValidation, validate, async (req, res) => {
  try {

    const companyId = req.user.companyId || req.user?.company?.id;

    const { prisma } = require('../../../config/database');


    const where = {
      id: req.params.id,
      ...(req.user.role === 'VENDOR' ? {} : { companyId: companyId }),
    };

    const vendor = await prisma.vendor.findFirst({ where });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }


    let updateData = req.body;
    if (req.user.role === 'VENDOR') {
      const allowedFields = ['phone', 'address', 'city', 'state', 'pincode', 'bankName', 'bankAccount', 'ifscCode'];
      updateData = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: { vendor: updatedVendor },
      message: 'Vendor updated',
    });
  } catch (error) {
    console.error('Error in PUT /:id:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.delete('/:id', authorizeRoles('ADMIN'), async (req, res) => {
  try {

    const companyId = req.user.companyId || req.user?.company?.id;

    const { prisma } = require('../../../config/database');

    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: companyId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { vendorId: req.params.id } });
      await tx.invoice.deleteMany({ where: { vendorId: req.params.id } });

      const vendorContracts = await tx.contract.findMany({
        where: { vendorId: req.params.id },
        select: { id: true }
      });
      const contractIds = vendorContracts.map(c => c.id);

      if (contractIds.length > 0) {
        await tx.contractDocument.deleteMany({ where: { contractId: { in: contractIds } } });
      }

      await tx.contract.deleteMany({ where: { vendorId: req.params.id } });
      await tx.vendorDocument.deleteMany({ where: { vendorId: req.params.id } });

      await tx.vendor.delete({ where: { id: req.params.id } });

      if (vendor.userId) {
        await tx.user.delete({ where: { id: vendor.userId } });
      }
    });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Vendor deleted',
    });
  } catch (error) {
    console.error('Error in DELETE /:id:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get('/:id/stats', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), enforceVendorIsolation, async (req, res) => {
  try {

    const companyId = req.user.companyId || req.user?.company?.id;

    const { prisma } = require('../../../config/database');


    const where = {
      id: req.params.id,
      ...(req.user.role === 'VENDOR' ? {} : { companyId: companyId }),
    };

    const vendor = await prisma.vendor.findFirst({
      where,
      include: {
        _count: {
          select: { contracts: true, invoices: true, payments: true },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const [totalContracts, totalInvoices, totalPayments] = await Promise.all([
      prisma.contract.aggregate({
        where: { vendorId: req.params.id },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { vendorId: req.params.id },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { vendorId: req.params.id, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...vendor._count,
        totalContractValue: totalContracts._sum.amount || 0,
        totalInvoiced: totalInvoices._sum.totalAmount || 0,
        totalPaid: totalPayments._sum.amount || 0,
      },
      message: 'Vendor statistics retrieved',
    });
  } catch (error) {
    console.error('Error in GET /:id/stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.post('/:id/rate', authorizeRoles('ADMIN', 'FINANCE'), async (req, res) => {
  try {

    const companyId = req.user.companyId || req.user?.company?.id;

    const { prisma } = require('../../../config/database');

    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: companyId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const { rating } = req.body;
    const newRating = (vendor.rating * vendor.ratingCount + rating) / (vendor.ratingCount + 1);

    const updatedVendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { rating: newRating, ratingCount: vendor.ratingCount + 1 },
    });

    return res.status(200).json({
      success: true,
      data: { vendor: updatedVendor },
      message: 'Vendor rated',
    });
  } catch (error) {
    console.error('Error in POST /:id/rate:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get('/category/:category', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), async (req, res) => {
  try {

    const companyId = req.user.companyId || req.user?.company?.id;

    const { prisma } = require('../../../config/database');

    const where = {
      category: req.params.category,
      ...(req.user.role === 'VENDOR' ? { id: req.vendorId } : { companyId: companyId }),
    };

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { vendors },
      message: 'Vendors retrieved',
    });
  } catch (error) {
    console.error('Error in GET /category/:category:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

