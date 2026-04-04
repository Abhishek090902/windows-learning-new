import prisma from '../../config/db.js';
import { refundSessionFunds, releaseSessionFunds } from '../wallet/wallet.service.js';

const holdSessionFundsForBooking = async (tx, { learnerUserId, mentorId, sessionId, amount, topic }) => {
  let wallet = await tx.wallet.findUnique({
    where: { userId: learnerUserId },
  });

  if (!wallet) {
    wallet = await tx.wallet.create({
      data: { userId: learnerUserId },
    });
  }

  if (Number(wallet.balance) < Number(amount)) {
    const error = new Error('Insufficient wallet balance');
    error.statusCode = 400;
    throw error;
  }

  const nextAvailableBalance = Number(wallet.balance) - Number(amount);
  const nextHeldBalance = Number(wallet.heldBalance || 0) + Number(amount);

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { decrement: Number(amount) },
      heldBalance: { increment: Number(amount) },
    },
  });

  await tx.transaction.create({
    data: {
      walletId: wallet.id,
      amount: -Number(amount),
      type: 'ESCROW_HOLD',
      status: 'HELD',
      provider: 'INTERNAL',
      currency: 'INR',
      description: `Session escrow hold for ${topic || 'mentorship session'}`,
      referenceId: sessionId,
      metadata: { mentorId },
      availableBalanceAfter: nextAvailableBalance,
      heldBalanceAfter: nextHeldBalance,
      processedAt: new Date(),
    },
  });

  await tx.session.update({
    where: { id: sessionId },
    data: {
      fundsStatus: 'HELD',
    },
  });
};

export const createSession = async (
  learnerId,
  mentorId,
  startTime,
  endTime,
  topic,
  meetingLink
) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check for double booking
  const existingSession = await prisma.session.findFirst({
    where: {
      mentorId,
      status: { not: 'CANCELLED' },
      OR: [
        { startTime: { lte: start }, endTime: { gt: start } },
        { startTime: { lt: end }, endTime: { gte: end } },
      ],
    },
  });

  if (existingSession) {
    const error = new Error('Slot already booked');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const mentor = await tx.mentorProfile.findUnique({ where: { id: mentorId } });
    if (!mentor) throw new Error('Mentor not found');

    const learner = await tx.learnerProfile.findUnique({
      where: { userId: learnerId },
    });
    if (!learner) throw new Error('Learner profile not found');

    const amount = Number(mentor.hourlyRate || 0);

    const session = await tx.session.create({
      data: {
        mentorId,
        learnerId: learner.id,
        startTime: start,
        endTime: end,
        topic,
        amount,
        meetingLink,
        status: 'PENDING',
      },
      include: {
        mentor: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        learner: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Payment hold is temporarily skipped in testing mode until real gateway
    // credentials are configured. Session approval still follows mentor acceptance.

    return session;
  });
};

export const getSessionById = async (id) => prisma.session.findUnique({
  where: { id },
  include: {
    mentor: {
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    },
    learner: {
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    },
    review: true,
  },
});

export const getLearnerSessions = async (userId) => {
  const learner = await prisma.learnerProfile.findUnique({
    where: { userId },
  });

  return await prisma.session.findMany({
    where: { learnerId: learner.id },
    include: {
      mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
      review: true,
    },
    orderBy: { startTime: 'desc' },
  });
};

export const getMentorSessions = async (userId) => {
  // userId is the user's ID, we need to get mentorProfileId first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mentorProfile: true },
  });

  return await prisma.session.findMany({
    where: { mentorId: user.mentorProfile.id },
    include: {
      mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
      learner: { include: { user: { select: { id: true, name: true, email: true } } } },
      review: true,
    },
    orderBy: { startTime: 'desc' },
  });
};

export const updateSessionStatus = async (id, status) => {
  const session = await prisma.session.update({
    where: { id },
    data: { status },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      learner: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (status === 'COMPLETED' && session.fundsStatus === 'HELD') {
    await releaseSessionFunds({
      sessionId: session.id,
      learnerUserId: session.learner.user.id,
      mentorUserId: session.mentor.user.id,
      amount: Number(session.amount),
      topic: session.topic,
    });
  }

  if (status === 'CANCELLED' && session.fundsStatus === 'HELD') {
    await refundSessionFunds({
      sessionId: session.id,
      learnerUserId: session.learner.user.id,
      amount: Number(session.amount),
      topic: session.topic,
    });
  }

  return await prisma.session.findUnique({
    where: { id: session.id },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      learner: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
};
