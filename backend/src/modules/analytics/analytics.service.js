import prisma from '../../config/db.js';

export const getLearnerAnalytics = async (learnerId) => {
  const learnerProfile = await prisma.learnerProfile.findUnique({ where: { userId: learnerId } });

  const [userWallet, totalSessions, completedSessions, totalSpent] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: learnerId } }),
    prisma.session.count({ where: { learnerId: learnerProfile?.id || '' } }),
    prisma.session.count({ where: { learnerId: learnerProfile?.id || '', status: 'COMPLETED' } }),
    prisma.transaction.aggregate({
      where: { wallet: { userId: learnerId }, type: { in: ['PAYMENT', 'ESCROW_HOLD'] }, status: { in: ['HELD', 'SUCCEEDED'] } },
      _sum: { amount: true }
    })
  ]);

  return {
    walletBalance: userWallet?.balance || 0,
    heldBalance: userWallet?.heldBalance || 0,
    totalSessions,
    completedSessions,
    totalSpent: totalSpent._sum.amount || 0
  };
};

export const getMentorAnalytics = async (mentorId) => {
  const user = await prisma.user.findUnique({
    where: { id: mentorId },
    include: { mentorProfile: true }
  });

  const [wallet, totalSessions, completedSessions, totalEarnings] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: mentorId } }),
    prisma.session.count({ where: { mentorId: user.mentorProfile.id } }),
    prisma.session.count({ where: { mentorId: user.mentorProfile.id, status: 'COMPLETED' } }),
    prisma.transaction.aggregate({
      where: { wallet: { userId: mentorId }, type: { in: ['PAYOUT', 'DEPOSIT'] }, status: 'SUCCEEDED' },
      _sum: { amount: true }
    })
  ]);

  return {
    walletBalance: wallet?.balance || 0,
    heldBalance: wallet?.heldBalance || 0,
    totalSessions,
    completedSessions,
    totalEarnings: totalEarnings._sum.amount || 0
  };
};
