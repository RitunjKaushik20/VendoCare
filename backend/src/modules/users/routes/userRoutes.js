
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { authorize } = require('../../../core/middlewares/role');
const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
const { validate } = require('../../../core/middlewares/validation');
const userController = require('../userController');
const { createValidation, updateValidation } = require('../userValidator');


router.use(authenticate);
router.use(enforceCompanyIsolation());


router.get('/', authorize(['ADMIN']), userController.getAll);
router.post('/', authorize(['ADMIN']), createValidation, validate, userController.create);
router.get('/:id', authorize(['ADMIN']), userController.getById);
router.put('/:id', authorize(['ADMIN']), updateValidation, validate, userController.update);
router.delete('/:id', authorize(['ADMIN']), userController.delete);

module.exports = router;
