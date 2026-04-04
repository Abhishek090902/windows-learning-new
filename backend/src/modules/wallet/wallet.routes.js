import express from 'express';
import * as walletController from './wallet.controller.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', walletController.getWalletConfig);
router.post('/webhooks/stripe', walletController.stripeWebhook);
router.post('/webhooks/razorpay', walletController.razorpayWebhook);

router.get('/', protect, walletController.getWallet);

router.get('/payment-methods', protect, authorize('LEARNER'), walletController.getPaymentMethods);
router.post('/payment-methods', protect, authorize('LEARNER'), walletController.createPaymentMethod);
router.delete('/payment-methods/:id', protect, authorize('LEARNER'), walletController.deletePaymentMethod);

router.get('/payout-methods', protect, authorize('MENTOR'), walletController.getPayoutMethods);
router.post('/payout-methods', protect, authorize('MENTOR'), walletController.createPayoutMethod);
router.delete('/payout-methods/:id', protect, authorize('MENTOR'), walletController.deletePayoutMethod);

router.post('/deposit-intent', protect, authorize('LEARNER'), walletController.createDepositIntent);
router.post('/verify-razorpay', protect, authorize('LEARNER'), walletController.verifyRazorpayPayment);
router.post('/withdrawals', protect, authorize('MENTOR'), walletController.createWithdrawal);

export default router;
