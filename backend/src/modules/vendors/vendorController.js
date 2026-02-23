
const vendorService = require('./vendorService');
const { ok, created, badRequest, notFound } = require('../../core/utils/response');

class VendorController {
  
  async getAll(req, res) {
    try {
      const { page, limit, search, category, status } = req.query;
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const result = await vendorService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        category,
        status,
        companyId,
      });
      return ok(res, result, 'Vendors retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getById(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const vendor = await vendorService.getById(req.params.id, companyId);
      return ok(res, vendor, 'Vendor retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async create(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const vendor = await vendorService.create(req.body, companyId, req.user.id);
      return created(res, vendor, 'Vendor created');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async update(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const vendor = await vendorService.update(req.params.id, req.body, companyId);
      return ok(res, vendor, 'Vendor updated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async delete(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      await vendorService.delete(req.params.id, companyId);
      return ok(res, null, 'Vendor deleted');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getStats(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const stats = await vendorService.getStats(req.params.id, companyId);
      return ok(res, stats, 'Vendor statistics retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async rate(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { rating } = req.body;
      const vendor = await vendorService.rateVendor(req.params.id, { rating }, companyId);
      return ok(res, vendor, 'Vendor rated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getByCategory(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { category } = req.params;
      const vendors = await vendorService.getByCategory(category, companyId);
      return ok(res, vendors, 'Vendors retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new VendorController();
