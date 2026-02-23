
const { prisma } = require('../../config/database');

const requireFinance = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  if (req.user.role !== 'FINANCE') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Finance role required.',
      code: 'FORBIDDEN',
    });
  }

  next();
};

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

const blockVendorCreation = async (req, res, next) => {
  if (req.user?.role === 'FINANCE' && req.method === 'POST') {
    const baseUrl = req.baseUrl || req.path;
    if (baseUrl.includes('/vendors')) {
      return res.status(403).json({
        success: false,
        message: 'Finance users cannot create vendors.',
        code: 'ACTION_NOT_ALLOWED',
      });
    }
  }
  next();
};

const blockContractModification = async (req, res, next) => {
  if (req.user?.role === 'FINANCE' && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const baseUrl = req.baseUrl || req.path;
    if (baseUrl.includes('/contracts') && !baseUrl.includes('/list') && !baseUrl.includes('/my')) {
      return res.status(403).json({
        success: false,
        message: 'Finance users cannot modify contracts.',
        code: 'ACTION_NOT_ALLOWED',
      });
    }
  }
  next();
};

const blockInvoiceEditing = async (req, res, next) => {
  if (req.user?.role === 'FINANCE' && req.method === 'PUT') {
    const baseUrl = req.baseUrl || req.path;
    if (baseUrl.includes('/invoices') && !req.path.includes('/pay')) {
      
      if (!req.path.includes('/pay') && !req.body.status) {
        return res.status(403).json({
          success: false,
          message: 'Finance users can only mark invoices as paid.',
          code: 'ACTION_NOT_ALLOWED',
        });
      }
    }
  }
  next();
};

const enforceFinanceFilters = async (req, res, next) => {
  if (!req.user?.companyId) {
    return res.status(400).json({
      success: false,
      message: 'Company context not found',
      code: 'NO_COMPANY',
    });
  }

  req.companyId = req.user.companyId;
  
  
  if (req.user.role === 'FINANCE') {
    if (!req.query.status) {
      
      req.query.status = 'APPROVED';
    }
  }
  
  next();
};

const getFinanceFilter = (companyId) => {
  return { companyId };
};

const verifyInvoicePayable = async (req, res, next) => {
  const { invoiceId } = req.params;
  
  if (!invoiceId) {
    return next();
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: req.user.companyId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    if (invoice.status !== 'APPROVED' && invoice.status !== 'OVERDUE') {
      return res.status(400).json({
        success: false,
        message: `Invoice cannot be paid. Current status: ${invoice.status}`,
        code: 'INVALID_STATUS',
      });
    }

    
    const existingPayment = await prisma.payment.findFirst({
      where: { invoiceId },
    });

    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Invoice has already been paid',
        code: 'ALREADY_PAID',
      });
    }

    req.invoice = invoice;
    next();
  } catch (error) {
    console.error('Invoice verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify invoice',
      code: 'VERIFICATION_ERROR',
    });
  }
};

const preventDuplicatePayment = async (req, res, next) => {
  const { invoiceId, transactionId } = req.body;

  if (!invoiceId) {
    return next();
  }

  try {
    
    const existingPayment = await prisma.payment.findFirst({
      where: {
        invoiceId,
        status: 'COMPLETED',
      },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate payment detected. Invoice has already been paid.',
        code: 'DUPLICATE_PAYMENT',
      });
    }

    
    if (transactionId) {
      const duplicateTransaction = await prisma.payment.findFirst({
        where: { transactionId },
      });

      if (duplicateTransaction) {
        return res.status(400).json({
          success: false,
          message: 'This transaction ID has already been used.',
          code: 'DUPLICATE_TRANSACTION',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Duplicate payment check error:', error);
    next();
  }
};

module.exports = {
  requireFinance,
  requireAdminOrFinance,
  blockVendorCreation,
  blockContractModification,
  blockInvoiceEditing,
  enforceFinanceFilters,
  getFinanceFilter,
  verifyInvoicePayable,
  preventDuplicatePayment,
};

