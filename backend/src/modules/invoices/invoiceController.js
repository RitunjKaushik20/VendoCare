
const invoiceService = require('./invoiceService');
const { ok, created, badRequest } = require('../../core/utils/response');

class InvoiceController {
  
  async getAll(req, res) {
    try {
      const { page, limit, search, status, vendorId } = req.query;
      
      
      let effectiveVendorId = vendorId;
      if (req.user.role === 'VENDOR' && req.vendorId) {
        effectiveVendorId = req.vendorId;
      }
      
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const result = await invoiceService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        status,
        vendorId: effectiveVendorId,
        companyId,
      });
      return ok(res, result, 'Invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getMyInvoices(req, res) {
    try {
      if (!req.vendorId) {
        return badRequest(res, 'Vendor profile not found');
      }
      
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoices = await invoiceService.getMyInvoices(req.vendorId, companyId);
      return ok(res, invoices, 'Vendor invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getById(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoice = await invoiceService.getById(req.params.id, companyId);
      
      
      if (req.user.role === 'VENDOR' && invoice.vendorId !== req.vendorId) {
        return badRequest(res, 'Invoice not found');
      }
      
      return ok(res, invoice, 'Invoice retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async create(req, res) {
    try {
      
      let vendorId = req.body.vendorId;
      if (req.user.role === 'VENDOR') {
        vendorId = req.vendorId;
      }
      
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoice = await invoiceService.create(
        { ...req.body, vendorId },
        companyId
      );
      return created(res, invoice, 'Invoice created');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async update(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoice = await invoiceService.update(req.params.id, req.body, companyId);
      return ok(res, invoice, 'Invoice updated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async delete(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      await invoiceService.delete(req.params.id, companyId);
      return ok(res, null, 'Invoice deleted');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async updateStatus(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { status, notes } = req.body;
      const invoice = await invoiceService.updateStatus(req.params.id, status, companyId, notes);
      return ok(res, invoice, 'Invoice status updated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async approve(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { notes } = req.body;
      const invoice = await invoiceService.approveInvoice(req.params.id, companyId, notes);
      return ok(res, invoice, 'Invoice approved successfully');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async reject(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const { reason } = req.body;
      if (!reason) {
        return badRequest(res, 'Rejection reason is required');
      }
      const invoice = await invoiceService.rejectInvoice(req.params.id, reason, companyId);
      return ok(res, invoice, 'Invoice rejected');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getPending(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoices = await invoiceService.getPending(companyId);
      return ok(res, invoices, 'Pending invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getApproved(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoices = await invoiceService.getApproved(companyId);
      return ok(res, invoices, 'Approved invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getOverdue(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const invoices = await invoiceService.getOverdue(companyId);
      return ok(res, invoices, 'Overdue invoices retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getStats(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const stats = await invoiceService.getStats(companyId);
      return ok(res, stats, 'Invoice statistics retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async sendReminder(req, res) {
    try {
      const companyId = req.companyId || req.user?.companyId || (req.user?.company?.id);
      const result = await invoiceService.sendReminder(req.params.id, companyId);
      return ok(res, result, 'Payment reminder sent successfully');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new InvoiceController();
