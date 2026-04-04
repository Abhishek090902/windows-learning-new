import * as walletService from './wallet.service.js';
import { sendSuccess } from '../../utils/responseHandler.js';
import { emitDataUpdate } from '../../utils/socketEmitter.js';

const syncWallet = (req, userIds) => {
  emitDataUpdate(req.app.get('io'), userIds, 'wallet');
  emitDataUpdate(req.app.get('io'), userIds, 'analytics');
};

export const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.userId);
    return sendSuccess(res, wallet, 'Wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getWalletConfig = async (_req, res, next) => {
  try {
    const config = await walletService.getWalletConfig();
    return sendSuccess(res, config, 'Wallet config retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await walletService.listPaymentMethods(req.user.userId);
    return sendSuccess(res, methods, 'Payment methods retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createPaymentMethod = async (req, res, next) => {
  try {
    const method = await walletService.savePaymentMethod(req.user.userId, req.body);
    return sendSuccess(res, method, 'Payment method saved successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const deletePaymentMethod = async (req, res, next) => {
  try {
    await walletService.removePaymentMethod(req.user.userId, req.params.id);
    return sendSuccess(res, null, 'Payment method removed successfully');
  } catch (error) {
    next(error);
  }
};

export const getPayoutMethods = async (req, res, next) => {
  try {
    const methods = await walletService.listPayoutMethods(req.user.userId);
    return sendSuccess(res, methods, 'Payout methods retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createPayoutMethod = async (req, res, next) => {
  try {
    const method = await walletService.savePayoutMethod(req.user.userId, req.body);
    return sendSuccess(res, method, 'Payout method saved successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const deletePayoutMethod = async (req, res, next) => {
  try {
    await walletService.removePayoutMethod(req.user.userId, req.params.id);
    return sendSuccess(res, null, 'Payout method removed successfully');
  } catch (error) {
    next(error);
  }
};

export const createDepositIntent = async (req, res, next) => {
  try {
    const result = await walletService.createDepositIntent(req.user.userId, req.body);
    return sendSuccess(res, result, 'Deposit intent created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const transaction = await walletService.verifyRazorpayCheckout(req.body);
    syncWallet(req, req.user.userId);
    return sendSuccess(res, transaction, 'Razorpay payment verified successfully');
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = walletService.verifyStripeWebhook(signature, req.rawBody);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transaction = await walletService.markDepositSucceeded({
        transactionId: paymentIntent.metadata?.walletTransactionId,
        externalReference: paymentIntent.id,
        gatewayPaymentId: paymentIntent.id,
        provider: 'STRIPE',
        rawPayload: paymentIntent,
      });
      if (transaction?.wallet?.userId) {
        syncWallet(req, transaction.wallet.userId);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await walletService.markDepositFailed({
        externalReference: paymentIntent.id,
        provider: 'STRIPE',
        rawPayload: paymentIntent,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({ error: error.message || 'Stripe webhook failed' });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    walletService.verifyRazorpayWebhook(req.headers['x-razorpay-signature'], req.rawBody);

    const payload = JSON.parse(req.rawBody);
    const paymentEntity = payload?.payload?.payment?.entity;
    const event = payload?.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const transaction = await walletService.markDepositSucceeded({
        externalReference: paymentEntity.order_id,
        gatewayPaymentId: paymentEntity.id,
        provider: 'RAZORPAY',
        rawPayload: payload,
      });
      if (transaction?.wallet?.userId) {
        syncWallet(req, transaction.wallet.userId);
      }
    }

    if (event === 'payment.failed') {
      await walletService.markDepositFailed({
        externalReference: paymentEntity.order_id,
        provider: 'RAZORPAY',
        rawPayload: payload,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return res.status(400).json({ error: error.message || 'Razorpay webhook failed' });
  }
};

export const createWithdrawal = async (req, res, next) => {
  try {
    const result = await walletService.createWithdrawalRequest(req.user.userId, req.body);
    syncWallet(req, req.user.userId);
    return sendSuccess(res, result, 'Withdrawal request created successfully', 201);
  } catch (error) {
    next(error);
  }
};
