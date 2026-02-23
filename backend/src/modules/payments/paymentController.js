
const paymentService = require('./paymentService');
const { ok, badRequest, created } = require('../../core/utils/response');

class PaymentController {
  
  async getAll(req, res) {
    try {
      const { page, limit, search, status, vendorId } = req.query;
      const result = await paymentService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        status,
        vendorId,
        companyId: req.user.companyId,
      });
      return ok(res, result, 'Payments retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getById(req, res) {
    try {
      const payment = await paymentService.getById(req.params.id, req.user.companyId);
      return ok(res, payment, 'Payment retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async create(req, res) {
    try {
      const payment = await paymentService.create(req.body, req.user.companyId);
      return created(res, payment, 'Payment created');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async delete(req, res) {
    try {
      await paymentService.delete(req.params.id, req.user.companyId);
      return ok(res, null, 'Payment deleted');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async initiateRazorpay(req, res) {
    try {
      const { invoiceId } = req.body;
      const result = await paymentService.processWithRazorpay(invoiceId, req.user.companyId);
      return ok(res, result, 'Razorpay order initiated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async verifyRazorpay(req, res) {
    try {
      const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const payment = await paymentService.verifyAndComplete(
        paymentId,
        { razorpayOrderId, razorpayPaymentId, razorpaySignature },
        req.user.companyId
      );
      return ok(res, payment, 'Payment verified and completed');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const payment = await paymentService.updateStatus(req.params.id, status, req.user.companyId);
      return ok(res, payment, 'Payment status updated');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async refund(req, res) {
    try {
      const { amount, reason } = req.body;
      const payment = await paymentService.refund(req.params.id, { amount, reason }, req.user.companyId);
      return ok(res, payment, 'Payment refunded');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getByVendor(req, res) {
    try {
      const { vendorId } = req.params;
      const payments = await paymentService.getByVendor(vendorId, req.user.companyId);
      return ok(res, payments, 'Vendor payments retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getByInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const payment = await paymentService.getByInvoice(invoiceId, req.user.companyId);
      return ok(res, payment, 'Invoice payment retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getHistory(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const payments = await paymentService.getHistory({ startDate, endDate }, req.user.companyId);
      return ok(res, payments, 'Payment history retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }

  
  async getStats(req, res) {
    try {
      const stats = await paymentService.getStats(req.user.companyId);
      return ok(res, stats, 'Payment statistics retrieved');
    } catch (error) {
      return badRequest(res, error.message);
    }
  }
}

module.exports = new PaymentController();
