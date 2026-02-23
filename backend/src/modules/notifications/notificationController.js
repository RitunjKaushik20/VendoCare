
const notificationService = require('./notificationService');
const { ok, badRequest } = require('../../core/utils/response');

class NotificationController {
  
  async getAll(req, res) {
    try {
      const { page, limit, isRead } = req.query;
      const result = await notificationService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      });
      return ok(res, result, 'Notifications retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async markAsRead(req, res) {
    try {
      await notificationService.markAsRead(req.params.id);
      return ok(res, null, 'Notification marked as read');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead();
      return ok(res, null, 'All notifications marked as read');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async delete(req, res) {
    try {
      await notificationService.delete(req.params.id);
      return ok(res, null, 'Notification deleted');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new NotificationController();
