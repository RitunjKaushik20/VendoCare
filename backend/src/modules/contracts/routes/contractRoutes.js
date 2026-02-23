
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { authorizeRoles } = require('../../../core/middlewares/role');
const { deriveVendorId } = require('../../../core/middlewares/vendor');
const { validate } = require('../../../core/middlewares/validation');
const contractController = require('../contractController');
const contractService = require('../contractService');
const { createValidation, updateValidation, renewValidation } = require('../contractValidator');


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
    
    const contracts = await contractService.getMyContracts(req.vendorId, req.user.companyId);
    
    return res.status(200).json({
      success: true,
      data: { contracts },
      message: 'Vendor contracts retrieved',
    });
  } catch (error) {
    console.error('Error fetching vendor contracts:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get('/', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), contractController.getAll);
router.get('/:id', authorizeRoles('ADMIN', 'FINANCE', 'VENDOR'), contractController.getById);
router.post('/', authorizeRoles('ADMIN', 'FINANCE'), createValidation, validate, contractController.create);
router.put('/:id', authorizeRoles('ADMIN', 'FINANCE'), updateValidation, validate, contractController.update);
router.delete('/:id', authorizeRoles('ADMIN'), contractController.delete);


router.put('/:id/renew', authorizeRoles('ADMIN', 'FINANCE'), renewValidation, validate, contractController.renew);
router.put('/:id/terminate', authorizeRoles('ADMIN', 'FINANCE'), contractController.terminate);
router.get('/list/expiring', authorizeRoles('ADMIN', 'FINANCE'), contractController.getExpiring);
router.get('/list/expired', authorizeRoles('ADMIN', 'FINANCE'), contractController.getExpired);

module.exports = router;

