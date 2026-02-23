
const contractService = require('./contractService');
const { ok, created, badRequest } = require('../../core/utils/response');

class ContractController {
  
  async getAll(req, res) {
    try {
      const { page, limit, search, status } = req.query;
      let vendorId = req.query.vendorId;
      if (req.user && req.user.role === 'VENDOR') {
        vendorId = req.vendorId;
      }
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const result = await contractService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        status,
        vendorId,
        companyId,
      });
      return ok(res, result, 'Contracts retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getById(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const contract = await contractService.getById(req.params.id, companyId);
      return ok(res, contract, 'Contract retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async create(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const contract = await contractService.create(req.body, companyId);
      return created(res, contract, 'Contract created');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async update(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const contract = await contractService.update(req.params.id, req.body, companyId);
      return ok(res, contract, 'Contract updated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async delete(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      await contractService.delete(req.params.id, companyId);
      return ok(res, null, 'Contract deleted');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async renew(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { endDate, amount } = req.body;
      const contract = await contractService.renew(req.params.id, { endDate, amount }, companyId);
      return ok(res, contract, 'Contract renewed');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async terminate(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const contract = await contractService.terminate(req.params.id, companyId);
      return ok(res, contract, 'Contract terminated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getExpiring(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { days } = req.query;
      const contracts = await contractService.getExpiring(parseInt(days) || 30, companyId);
      return ok(res, contracts, 'Expiring contracts retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getExpired(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const contracts = await contractService.getExpired(companyId);
      return ok(res, contracts, 'Expired contracts retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new ContractController();
