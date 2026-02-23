
const razorpay = require('../../../config/razorpay');
const { verifyWebhookSignature } = require('../../../config/razorpay');
const logger = require('../../../core/utils/logger');

const { prisma } = require('../../../config/database');

const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  
  const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature, webhookSecret);

  if (!isValid) {
    logger.error('Razorpay webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  
  switch (event.event) {
    case 'payment.authorized':
      await handlePaymentAuthorized(event.payload);
      break;

    case 'payment.captured':
      await handlePaymentCaptured(event.payload);
      break;

    case 'payment.failed':
      await handlePaymentFailed(event.payload);
      break;

    case 'refund.created':
      await handleRefundCreated(event.payload);
      break;

    default:
      logger.info(`Unhandled Razorpay event: ${event.event}`);
  }

  res.json({ status: 'ok' });
};

async function handlePaymentAuthorized(payload) {
  const { payment } = payload;
  const razorpayPaymentId = payment.id;

  
  const dbPayment = await prisma.payment.findFirst({
    where: {
      OR: [
        { razorpayOrderId: payment.order_id },
        { razorpayPaymentId: razorpayPaymentId },
      ],
    },
  });

  if (dbPayment) {
    
    await prisma.payment.update({
      where: { id: dbPayment.id },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
        razorpayPaymentId: razorpayPaymentId,
      },
    });

    
    if (dbPayment.invoiceId) {
      await prisma.invoice.update({
        where: { id: dbPayment.invoiceId },
        data: { status: 'PAID', paidDate: new Date() },
      });
    }

    logger.info(`Payment authorized: ${razorpayPaymentId}`);
  }
}

async function handlePaymentCaptured(payload) {
  const { payment } = payload;
  const razorpayPaymentId = payment.id;

  const dbPayment = await prisma.payment.findFirst({
    where: { razorpayPaymentId: razorpayPaymentId },
  });

  if (dbPayment) {
    await prisma.payment.update({
      where: { id: dbPayment.id },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
      },
    });

    if (dbPayment.invoiceId) {
      await prisma.invoice.update({
        where: { id: dbPayment.invoiceId },
        data: { status: 'PAID', paidDate: new Date() },
      });
    }

    logger.info(`Payment captured: ${razorpayPaymentId}`);
  }
}

async function handlePaymentFailed(payload) {
  const { payment } = payload;
  const razorpayPaymentId = payment.id;

  const dbPayment = await prisma.payment.findFirst({
    where: {
      OR: [
        { razorpayOrderId: payment.order_id },
        { razorpayPaymentId: razorpayPaymentId },
      ],
    },
  });

  if (dbPayment) {
    await prisma.payment.update({
      where: { id: dbPayment.id },
      data: {
        status: 'FAILED',
        notes: `Payment failed: ${payment.error_description || payment.error_reason}`,
      },
    });

    logger.info(`Payment failed: ${razorpayPaymentId}`);
  }
}

async function handleRefundCreated(payload) {
  const { refund } = payload;
  const refundId = refund.id;

  const dbPayment = await prisma.payment.findFirst({
    where: { razorpayPaymentId: refund.payment_id },
  });

  if (dbPayment) {
    await prisma.payment.update({
      where: { id: dbPayment.id },
      data: {
        status: 'REFUNDED',
        notes: `Refund ID: ${refundId}`,
      },
    });

    if (dbPayment.invoiceId) {
      await prisma.invoice.update({
        where: { id: dbPayment.invoiceId },
        data: { status: 'PENDING', paidDate: null },
      });
    }

    logger.info(`Refund processed: ${refundId}`);
  }
}

module.exports = razorpayWebhook;
