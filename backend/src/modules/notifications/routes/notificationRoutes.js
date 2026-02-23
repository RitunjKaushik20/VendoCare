
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { enforceCompanyIsolation } = require('../../../core/middlewares/admin');
const notificationController = require('../notificationController');

router.use(authenticate);
router.use(enforceCompanyIsolation());

router.get('/', notificationController.getAll);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.delete);

module.exports = router;
