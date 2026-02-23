
const userService = require('./userService');
const { ok, created, badRequest, notFound } = require('../../core/utils/response');

class UserController {
  
  async getAll(req, res) {
    try {
      const { page, limit, search, role } = req.query;
      const result = await userService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        role,
        companyId: req.user.companyId,
      });
      return ok(res, result, 'Users retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getById(req, res) {
    try {
      const user = await userService.getById(req.params.id, req.user.companyId);
      return ok(res, user, 'User retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async create(req, res) {
    try {
      const { email, password, name, phone, role } = req.body;
      const user = await userService.create({
        email,
        password,
        name,
        phone,
        role,
        companyId: req.user.companyId,
      });
      return created(res, user, 'User created');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async update(req, res) {
    try {
      const { name, phone, role, isActive } = req.body;
      const user = await userService.update(
        req.params.id,
        { name, phone, role, isActive },
        req.user.companyId
      );
      return ok(res, user, 'User updated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async delete(req, res) {
    try {
      await userService.delete(req.params.id, req.user.companyId);
      return ok(res, null, 'User deleted');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new UserController();
