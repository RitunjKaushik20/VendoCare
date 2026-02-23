
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../../../core/middlewares/auth');
const { authorizeRoles } = require('../../../core/middlewares/role');
const { deriveVendorId, enforceVendorIsolation } = require('../../../core/middlewares/vendor');
const { validate } = require('../../../core/middlewares/validation');
const invoiceController = require('../invoiceController');
const invoiceService = require('../invoiceService');
const { createValidation, updateValidation, statusValidation } = require('../invoiceValidator');
const { upload } = require('../upload/multerConfig');
const { uploadToCloudinary } = require('../../../config/cloudinary');


router.use(authenticate);
router.use(deriveVendorId);


const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
router.use(enforceCompanyIsolation());


router.get('/my', authorizeRoles('VENDOR'), async (req, res) => {
  try {
    if (!req.vendorId) {
      return res.status(404).json({
        success: false,
        message: 'No vendor profile found for this user',
      });
    }
    
    const invoices = await invoiceService.getMyInvoices(req.vendorId, req.user.companyId);
    
    return res.status(200).json({
      success: true,
      data: { invoices },
      message: 'Vendor invoices retrieved',
    });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get('/', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), invoiceController.getAll);
router.get('/:id', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), invoiceController.getById);


router.post('/', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), async (req, res) => {
  try {
    let vendorId = req.body.vendorId;
    
    
    if (req.user.role === 'VENDOR') {
      if (!req.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'Vendor profile not found',
        });
      }
      vendorId = req.vendorId;
    }
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required',
      });
    }
    
    
    if (['ADMIN', 'FINANCE'].includes(req.user.role)) {
      const { prisma } = require('../../../config/database');
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }
    }
    
    const invoice = await invoiceService.create(
      { ...req.body, vendorId },
      req.user.companyId
    );
    
    return res.status(201).json({
      success: true,
      data: { invoice },
      message: 'Invoice created',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


router.put('/:id', authorizeRoles('ADMIN', 'FINANCE'), updateValidation, validate, invoiceController.update);


router.delete('/:id', authorizeRoles('ADMIN'), invoiceController.delete);


router.post('/upload', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    
    let mimeType = 'application/pdf';
    if (req.file.mimetype === 'image/jpeg') mimeType = 'image/jpeg';
    else if (req.file.mimetype === 'image/png') mimeType = 'image/png';
    
    
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'vendocare/invoices',
      mimeType: mimeType,
    });
    
    
    let vendorId = req.body.vendorId;
    if (req.user.role === 'VENDOR') {
      vendorId = req.vendorId;
    }
    
    const invoice = await invoiceService.uploadWithFile(
      { ...req.body, vendorId },
      {
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
      },
      req.user.companyId
    );
    
    return res.status(201).json({ 
      success: true, 
      data: { invoice },
      message: 'Invoice uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
});


router.get('/:id/download', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), async (req, res) => {
  try {
    const invoice = await invoiceService.getById(req.params.id, req.user.companyId);
    
    if (!invoice.fileUrl) {
      return res.status(404).json({ success: false, message: 'No file attached to this invoice' });
    }
    
    
    const response = await axios({
      method: 'GET',
      url: invoice.fileUrl,
      responseType: 'stream',
    });
    
    
    const contentType = response.headers['content-type'] || 'application/pdf';
    const filename = `invoice-${invoice.invoiceNumber || req.params.id}.pdf`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
});


router.put('/:id/status', authorizeRoles('ADMIN', 'FINANCE'), statusValidation, validate, invoiceController.updateStatus);
router.post('/:id/approve', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.approve);
router.post('/:id/reject', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.reject);


router.get('/list/pending', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.getPending);
router.get('/list/approved', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.getApproved);
router.get('/list/overdue', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.getOverdue);
router.get('/stats', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.getStats);
router.post('/:id/remind', authorizeRoles('ADMIN', 'FINANCE'), invoiceController.sendReminder);

module.exports = router;

