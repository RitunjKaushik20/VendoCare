
const { prisma } = require('../../config/database');

const deriveVendorId = async (req, res, next) => {
  try {
    
    req.vendorId = null;

    
    if (req.user && req.user.role === 'VENDOR') {
      
      if (req.user.vendorId) {
        req.vendorId = req.user.vendorId;
        return next();
      }

      
      const vendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { userId: req.user.id },
            { createdById: req.user.id }
          ]
        },
        select: { id: true, companyId: true, status: true }
      });

      if (vendor) {
        req.vendorId = vendor.id;
        req.vendorCompanyId = vendor.companyId;
        req.vendorStatus = vendor.status;

        
        req.vendor = vendor;
      } else {
        
        console.warn(`Vendor profile not found for user: ${req.user.id}`);
      }
    }

    

    next();
  } catch (error) {
    console.error('Error deriving vendorId:', error);
    
    next();
  }
};

const enforceVendorIsolation = async (req, res, next) => {
  
  if (req.user && req.user.role === 'VENDOR') {
    if (!req.vendorId) {
      return res.status(403).json({
        success: false,
        message: 'Vendor profile not found. Please contact administrator.',
        code: 'VENDOR_PROFILE_NOT_FOUND'
      });
    }
  }

  next();
};

const requireActiveVendor = async (req, res, next) => {
  if (req.user && req.user.role === 'VENDOR') {
    if (!req.vendorId) {
      return res.status(403).json({
        success: false,
        message: 'Vendor profile not found.',
        code: 'VENDOR_PROFILE_NOT_FOUND'
      });
    }

    if (req.vendorStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Vendor account is ${req.vendorStatus.toLowerCase()}. Please contact administrator.`,
        code: 'VENDOR_NOT_ACTIVE'
      });
    }
  }

  next();
};

const getVendorFilter = (companyId, vendorId) => {
  
  if (vendorId) {
    return { vendorId };
  }

  
  
  if (companyId) {
    return { companyId };
  }

  
  return {};
};

const attachVendorContext = async (req, res, next) => {
  
  if (req.user && req.user.role === 'VENDOR' && !req.vendorId) {
    await deriveVendorId(req, res, () => { });
  }

  
  req.getVendorFilter = () => getVendorFilter(req.user?.companyId, req.vendorId);
  req.isVendorRequest = () => req.user?.role === 'VENDOR';
  req.isAdminOrFinance = () => ['ADMIN', 'FINANCE'].includes(req.user?.role);

  next();
};

module.exports = {
  deriveVendorId,
  enforceVendorIsolation,
  requireActiveVendor,
  getVendorFilter,
  attachVendorContext
};

