
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../core/middlewares/auth');
const { requireAdminOrFinance, enforceCompanyIsolation } = require('../../../core/middlewares/admin');
const auditService = require('../auditService');


router.use(authenticate);
router.use(enforceCompanyIsolation());

router.get('/logs', requireAdminOrFinance, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      entity,
      action,
      userId,
      startDate,
      endDate,
    } = req.query;

    const result = await auditService.getLogs(req.companyId, {
      page: parseInt(page),
      limit: parseInt(limit),
      entity,
      action,
      userId,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Audit logs retrieved',
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
    });
  }
});

router.get('/entity/:entity/:entityId', requireAdminOrFinance, async (req, res) => {
  try {
    const { entity, entityId } = req.params;

    const logs = await auditService.getEntityLogs(req.companyId, entity, entityId);

    return res.status(200).json({
      success: true,
      data: { logs },
      message: 'Entity audit logs retrieved',
    });
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve entity audit logs',
    });
  }
});

router.get('/user/:userId', requireAdminOrFinance, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await auditService.getUserLogs(req.companyId, userId, parseInt(limit));

    return res.status(200).json({
      success: true,
      data: { logs },
      message: 'User audit logs retrieved',
    });
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user audit logs',
    });
  }
});

router.get('/stats', requireAdminOrFinance, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await auditService.getStats(req.companyId, parseInt(days));

    return res.status(200).json({
      success: true,
      data: stats,
      message: 'Audit statistics retrieved',
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit statistics',
    });
  }
});

module.exports = router;

