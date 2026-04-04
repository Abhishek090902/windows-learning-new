import crypto from 'crypto';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import prisma from '../../config/db.js';
import config from '../../config/env.js';

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;
const razorpay = config.razorpayKeyId && config.razorpayKeySecret
  ? new Razorpay({ key_id: config.razorpayKeyId, key_secret: config.razorpayKeySecret })
  : null;

const zeroMoney = 0;

const toMinorUnits = (amount, currency = 'INR') => {
  const normalizedCurrency = currency.toUpperCase();
  const multiplier = ['JPY'].includes(normalizedCurrency) ? 1 : 100;
  return Math.round(Number(amount) * multiplier);
};

const ensureWallet = async (userId, tx = prisma) => {
  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: { userId },
    });
  }
  return wallet;
};

const computeNextBalances = (wallet, deltaAvailable = 0, deltaHeld = 0) => ({
  available: Number(wallet.balance) + Number(deltaAvailable),
  held: Number(wallet.heldBalance || 0) + Number(deltaHeld),
});

const createAuditLog = async (tx, userId, action, entity, entityId, newValues) => {
  await tx.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      newValues,
    },
  });
};

const createTransactionRecord = async (tx, wallet, data) => {
  const nextBalances = computeNextBalances(wallet, data.deltaAvailable || 0, data.deltaHeld || 0);

  return tx.transaction.create({
    data: {
      walletId: wallet.id,
      amount: Number(data.amount),
      type: data.type,
      status: data.status,
      provider: data.provider || 'INTERNAL',
      paymentMethodType: data.paymentMethodType || null,
      currency: data.currency || 'INR',
      description: data.description || null,
      referenceId: data.referenceId || null,
      externalReference: data.externalReference || null,
      gatewayOrderId: data.gatewayOrderId || null,
      gatewayPaymentId: data.gatewayPaymentId || null,
      gatewayPayoutId: data.gatewayPayoutId || null,
      paymentMethodLabel: data.paymentMethodLabel || null,
      metadata: data.metadata || null,
      availableBalanceAfter: nextBalances.available,
      heldBalanceAfter: nextBalances.held,
      processedAt: data.processedAt || null,
    },
  });
};

export const getWalletByUserId = async (userId) => {
  const wallet = await ensureWallet(userId);

  return prisma.wallet.findUnique({
    where: { id: wallet.id },
    include: {
      transactions: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { id: true, role: true, email: true, name: true },
      },
    },
  });
};

export const getWalletConfig = async () => ({
  stripePublishableKey: config.stripePublishableKey || null,
  razorpayKeyId: config.razorpayKeyId || null,
  supportedDepositProviders: [
    ...(config.razorpayKeyId ? ['RAZORPAY'] : []),
    ...(config.stripePublishableKey ? ['STRIPE'] : []),
  ],
});

export const listPaymentMethods = async (userId) => prisma.paymentMethod.findMany({
  where: { userId, isActive: true },
  orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
});

export const savePaymentMethod = async (userId, payload) => {
  if (payload.isDefault) {
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.paymentMethod.create({
    data: {
      userId,
      provider: payload.provider,
      type: payload.type,
      label: payload.label,
      brand: payload.brand || null,
      last4: payload.last4 || null,
      token: payload.token || null,
      gatewayCustomerId: payload.gatewayCustomerId || null,
      isDefault: Boolean(payload.isDefault),
      metadata: payload.metadata || null,
    },
  });
};

export const removePaymentMethod = async (userId, methodId) => prisma.paymentMethod.updateMany({
  where: { id: methodId, userId },
  data: { isActive: false, isDefault: false },
});

export const listPayoutMethods = async (userId) => prisma.payoutMethod.findMany({
  where: { userId, isActive: true },
  orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
});

export const savePayoutMethod = async (userId, payload) => {
  if (payload.isDefault) {
    await prisma.payoutMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const accountNumber = payload.accountNumber ? String(payload.accountNumber) : '';

  return prisma.payoutMethod.create({
    data: {
      userId,
      provider: payload.provider || 'MANUAL',
      type: payload.type,
      label: payload.label,
      accountHolderName: payload.accountHolderName || null,
      bankName: payload.bankName || null,
      accountNumberLast4: accountNumber ? accountNumber.slice(-4) : null,
      ifscCode: payload.ifscCode || null,
      upiId: payload.upiId || null,
      token: payload.token || null,
      isDefault: Boolean(payload.isDefault),
      metadata: payload.metadata || null,
    },
  });
};

export const removePayoutMethod = async (userId, methodId) => prisma.payoutMethod.updateMany({
  where: { id: methodId, userId },
  data: { isActive: false, isDefault: false },
});

export const createDepositIntent = async (userId, payload) => {
  const wallet = await ensureWallet(userId);
  const amount = Number(payload.amount);
  const currency = (payload.currency || 'INR').toUpperCase();

  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const provider = payload.provider?.toUpperCase();
  if (!['STRIPE', 'RAZORPAY'].includes(provider)) {
    throw new Error('Unsupported payment provider');
  }

  if (provider === 'STRIPE') {
    if (!stripe || !config.stripePublishableKey) {
      throw new Error('Stripe is not configured');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toMinorUnits(amount, currency),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        flow: 'wallet_deposit',
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        provider: 'STRIPE',
        currency,
        description: 'Wallet deposit initiated',
        externalReference: paymentIntent.id,
        paymentMethodType: payload.paymentMethodType || 'CARD',
        metadata: {
          clientSecret: paymentIntent.client_secret,
        },
        availableBalanceAfter: Number(wallet.balance),
        heldBalanceAfter: Number(wallet.heldBalance || 0),
      },
    });

    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        walletTransactionId: transaction.id,
        userId,
        flow: 'wallet_deposit',
      },
    });

    return {
      transaction,
      provider: 'STRIPE',
      clientSecret: paymentIntent.client_secret,
      publishableKey: config.stripePublishableKey,
      paymentIntentId: paymentIntent.id,
    };
  }

  if (!razorpay || !config.razorpayKeyId) {
    throw new Error('Razorpay is not configured');
  }

  const order = await razorpay.orders.create({
    amount: toMinorUnits(amount, currency),
    currency,
    receipt: `wl_${Date.now()}`,
    notes: {
      userId,
      flow: 'wallet_deposit',
    },
  });

  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: 'DEPOSIT',
      status: 'PENDING',
      provider: 'RAZORPAY',
      currency,
      description: 'Wallet deposit initiated',
      externalReference: order.id,
      gatewayOrderId: order.id,
      paymentMethodType: payload.paymentMethodType || null,
      metadata: { razorpayOrder: order },
      availableBalanceAfter: Number(wallet.balance),
      heldBalanceAfter: Number(wallet.heldBalance || 0),
    },
  });

  return {
    transaction,
    provider: 'RAZORPAY',
    keyId: config.razorpayKeyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    merchantName: 'Windows Learning',
    description: 'Wallet top-up',
  };
};

export const markDepositSucceeded = async ({ transactionId, externalReference, gatewayPaymentId, rawPayload, provider }) => {
  const existing = transactionId
    ? await prisma.transaction.findUnique({ where: { id: transactionId }, include: { wallet: true } })
    : await prisma.transaction.findFirst({
        where: {
          externalReference,
          provider,
          type: 'DEPOSIT',
        },
        include: { wallet: true },
      });

  if (!existing) {
    throw new Error('Deposit transaction not found');
  }

  if (existing.status === 'SUCCEEDED') {
    return existing;
  }

  return prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { id: existing.walletId },
      data: {
        balance: {
          increment: Number(existing.amount),
        },
      },
    });

    const updatedTransaction = await tx.transaction.update({
      where: { id: existing.id },
      data: {
        status: 'SUCCEEDED',
        gatewayPaymentId: gatewayPaymentId || existing.gatewayPaymentId,
        metadata: rawPayload || existing.metadata,
        processedAt: new Date(),
        availableBalanceAfter: Number(updatedWallet.balance),
        heldBalanceAfter: Number(updatedWallet.heldBalance || 0),
      },
    });

    await createAuditLog(tx, updatedWallet.userId, 'WALLET_DEPOSIT_SUCCEEDED', 'Transaction', updatedTransaction.id, {
      provider,
      amount: existing.amount,
    });

    return tx.transaction.findUnique({
      where: { id: updatedTransaction.id },
      include: {
        wallet: true,
      },
    });
  });
};

export const markDepositFailed = async ({ externalReference, provider, rawPayload }) => {
  const transaction = await prisma.transaction.findFirst({
    where: { externalReference, provider, type: 'DEPOSIT' },
  });

  if (!transaction || transaction.status === 'FAILED') {
    return transaction;
  }

  return prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'FAILED',
      metadata: rawPayload || transaction.metadata,
      processedAt: new Date(),
    },
  });
};

const executeRazorpayPayout = async (method, amount, currency, transactionId) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }
  const fundAccountId = method.token || method.metadata?.fundAccountId;
  if (!fundAccountId) {
    throw new Error('Razorpay payout method is missing a fund account token');
  }

  return razorpay.payouts.create({
    account_number: method.metadata?.accountNumber || method.metadata?.virtualAccountNumber || undefined,
    fund_account_id: fundAccountId,
    amount: toMinorUnits(amount, currency),
    currency,
    mode: method.type === 'UPI' ? 'UPI' : 'NEFT',
    purpose: 'payout',
    reference_id: transactionId,
    narration: 'Windows Learning mentor payout',
  });
};

const executeStripePayout = async (method, amount, currency) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  const destination = method.token || method.metadata?.destinationAccountId;
  if (!destination) {
    throw new Error('Stripe payout method is missing a connected account token');
  }

  return stripe.transfers.create({
    amount: toMinorUnits(amount, currency),
    currency: currency.toLowerCase(),
    destination,
    description: 'Windows Learning mentor payout',
  });
};

export const createWithdrawalRequest = async (userId, payload) => {
  const amount = Number(payload.amount);
  const currency = (payload.currency || 'INR').toUpperCase();
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const [wallet, payoutMethod, user] = await Promise.all([
    ensureWallet(userId),
    prisma.payoutMethod.findFirst({
      where: { id: payload.payoutMethodId, userId, isActive: true },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!user || user.role !== 'MENTOR') {
    throw new Error('Only mentors can withdraw earnings');
  }

  if (!payoutMethod) {
    throw new Error('Payout method not found');
  }

  if (Number(wallet.balance) < amount) {
    throw new Error('Insufficient available balance');
  }

  return prisma.$transaction(async (tx) => {
    const walletBefore = await tx.wallet.findUnique({ where: { id: wallet.id } });
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    let transaction = await createTransactionRecord(tx, walletBefore, {
      amount: -amount,
      deltaAvailable: -amount,
      type: 'WITHDRAWAL',
      status: 'PROCESSING',
      provider: payoutMethod.provider,
      paymentMethodType: payoutMethod.type,
      paymentMethodLabel: payoutMethod.label,
      currency,
      description: 'Withdrawal initiated',
      metadata: {
        payoutMethodId: payoutMethod.id,
      },
    });

    try {
      let payoutResponse = null;
      if (payoutMethod.provider === 'RAZORPAY') {
        payoutResponse = await executeRazorpayPayout(payoutMethod, amount, currency, transaction.id);
      } else if (payoutMethod.provider === 'STRIPE') {
        payoutResponse = await executeStripePayout(payoutMethod, amount, currency);
      }

      transaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: payoutResponse ? 'SUCCEEDED' : 'PROCESSING',
          gatewayPayoutId: payoutResponse?.id || null,
          externalReference: payoutResponse?.id || transaction.externalReference,
          metadata: payoutResponse || transaction.metadata,
          processedAt: payoutResponse ? new Date() : null,
          availableBalanceAfter: Number(updatedWallet.balance),
          heldBalanceAfter: Number(updatedWallet.heldBalance || 0),
        },
      });
    } catch (error) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      transaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          metadata: { error: error.message },
          processedAt: new Date(),
          availableBalanceAfter: Number(walletBefore.balance),
          heldBalanceAfter: Number(walletBefore.heldBalance || 0),
        },
      });

      throw error;
    }

    await createAuditLog(tx, userId, 'WALLET_WITHDRAWAL_CREATED', 'Transaction', transaction.id, {
      amount,
      payoutMethodId: payoutMethod.id,
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });
};

const holdSessionFundsInternal = async (tx, { learnerUserId, mentorId, sessionId, amount, topic }) => {
  const wallet = await ensureWallet(learnerUserId, tx);

  if (Number(wallet.balance) < Number(amount)) {
    throw new Error('Insufficient wallet balance');
  }

  const walletBefore = await tx.wallet.findUnique({ where: { id: wallet.id } });
  const updatedWallet = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { decrement: Number(amount) },
      heldBalance: { increment: Number(amount) },
    },
  });

  const transaction = await createTransactionRecord(tx, walletBefore, {
    amount: -Number(amount),
    deltaAvailable: -Number(amount),
    deltaHeld: Number(amount),
    type: 'ESCROW_HOLD',
    status: 'HELD',
    provider: 'INTERNAL',
    currency: 'INR',
    description: `Session escrow hold for ${topic || 'mentorship session'}`,
    referenceId: sessionId,
    metadata: { mentorId },
    processedAt: new Date(),
  });

  await tx.session.update({
    where: { id: sessionId },
    data: {
      fundsStatus: 'HELD',
    },
  });

  return { wallet: updatedWallet, transaction };
};

export const holdSessionFunds = async (args, tx = null) => {
  if (tx) {
    return holdSessionFundsInternal(tx, args);
  }
  return prisma.$transaction((innerTx) => holdSessionFundsInternal(innerTx, args));
};

const releaseSessionFundsInternal = async (tx, { sessionId, learnerUserId, mentorUserId, amount, topic }) => {
  const learnerWallet = await ensureWallet(learnerUserId, tx);
  const mentorWallet = await ensureWallet(mentorUserId, tx);

  const learnerBefore = await tx.wallet.findUnique({ where: { id: learnerWallet.id } });
  const mentorBefore = await tx.wallet.findUnique({ where: { id: mentorWallet.id } });

  const updatedLearnerWallet = await tx.wallet.update({
    where: { id: learnerWallet.id },
    data: {
      heldBalance: { decrement: Number(amount) },
    },
  });

  const updatedMentorWallet = await tx.wallet.update({
    where: { id: mentorWallet.id },
    data: {
      balance: { increment: Number(amount) },
    },
  });

  await createTransactionRecord(tx, learnerBefore, {
    amount: -Number(amount),
    deltaHeld: -Number(amount),
    type: 'PAYMENT',
    status: 'SUCCEEDED',
    provider: 'INTERNAL',
    currency: 'INR',
    description: `Escrow released for ${topic || 'mentorship session'}`,
    referenceId: sessionId,
    processedAt: new Date(),
  });

  await createTransactionRecord(tx, mentorBefore, {
    amount: Number(amount),
    deltaAvailable: Number(amount),
    type: 'PAYOUT',
    status: 'SUCCEEDED',
    provider: 'INTERNAL',
    currency: 'INR',
    description: `Session earnings credited for ${topic || 'mentorship session'}`,
    referenceId: sessionId,
    processedAt: new Date(),
  });

  await tx.session.update({
    where: { id: sessionId },
    data: {
      fundsStatus: 'RELEASED',
    },
  });

  return { learnerWallet: updatedLearnerWallet, mentorWallet: updatedMentorWallet };
};

export const releaseSessionFunds = async (args, tx = null) => {
  if (tx) {
    return releaseSessionFundsInternal(tx, args);
  }
  return prisma.$transaction((innerTx) => releaseSessionFundsInternal(innerTx, args));
};

const refundSessionFundsInternal = async (tx, { sessionId, learnerUserId, amount, topic }) => {
  const wallet = await ensureWallet(learnerUserId, tx);
  const walletBefore = await tx.wallet.findUnique({ where: { id: wallet.id } });

  const updatedWallet = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      heldBalance: { decrement: Number(amount) },
      balance: { increment: Number(amount) },
    },
  });

  await createTransactionRecord(tx, walletBefore, {
    amount: Number(amount),
    deltaAvailable: Number(amount),
    deltaHeld: -Number(amount),
    type: 'ESCROW_REFUND',
    status: 'SUCCEEDED',
    provider: 'INTERNAL',
    currency: 'INR',
    description: `Escrow refunded for ${topic || 'mentorship session'}`,
    referenceId: sessionId,
    processedAt: new Date(),
  });

  await tx.session.update({
    where: { id: sessionId },
    data: {
      fundsStatus: 'REFUNDED',
    },
  });

  return updatedWallet;
};

export const refundSessionFunds = async (args, tx = null) => {
  if (tx) {
    return refundSessionFundsInternal(tx, args);
  }
  return prisma.$transaction((innerTx) => refundSessionFundsInternal(innerTx, args));
};

export const verifyRazorpayCheckout = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const secret = config.razorpayKeySecret;
  if (!secret) {
    throw new Error('Razorpay is not configured');
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new Error('Invalid Razorpay signature');
  }

  return markDepositSucceeded({
    externalReference: razorpayOrderId,
    gatewayPaymentId: razorpayPaymentId,
    provider: 'RAZORPAY',
    rawPayload: {
      razorpayOrderId,
      razorpayPaymentId,
    },
  });
};

export const verifyStripeWebhook = (signature, rawBody) => {
  if (!stripe || !config.stripeWebhookSecret) {
    throw new Error('Stripe webhook is not configured');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
};

export const verifyRazorpayWebhook = (signature, rawBody) => {
  if (!config.razorpayWebhookSecret) {
    throw new Error('Razorpay webhook is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid Razorpay webhook signature');
  }

  return true;
};
