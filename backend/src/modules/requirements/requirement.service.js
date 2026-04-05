import prisma from '../../config/db.js';

export const createRequirement = async (learnerId, data) => {
  const { title, description, budget } = data;
  const user = await prisma.user.findUnique({
    where: { id: learnerId },
    include: { learnerProfile: true }
  });

  if (!user?.learnerProfile) {
    throw new Error('Learner profile not found');
  }

  return await prisma.learnerRequirement.create({
    data: {
      learnerId: user.learnerProfile.id,
      title,
      description,
      budget: budget ? parseFloat(budget) : null
    }
  });
};

export const getAllRequirements = async () => {
  return await prisma.learnerRequirement.findMany({
    where: { isActive: true },
    include: {
      learner: { include: { user: { select: { name: true } } } },
      _count: { select: { proposals: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getRequirementById = async (id, viewer = null) => {
  const requirement = await prisma.learnerRequirement.findUnique({
    where: { id },
    include: {
      learner: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { proposals: true } },
    },
  });

  if (!requirement) {
    return null;
  }

  if (!viewer?.userId) {
    return requirement;
  }

  if (viewer.role === 'MENTOR') {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: viewer.userId },
      select: { id: true },
    });

    if (!mentor) {
      return requirement;
    }

    const ownProposals = await prisma.proposal.findMany({
      where: {
        requirementId: id,
        mentorId: mentor.id,
      },
      select: {
        id: true,
        isActive: true,
        isAccepted: true,
        createdAt: true,
      },
    });

    return {
      ...requirement,
      proposals: ownProposals,
    };
  }

  if (viewer.role === 'LEARNER' && requirement.learner.user.id === viewer.userId) {
    const proposals = await prisma.proposal.findMany({
      where: { requirementId: id },
      include: {
        mentor: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...requirement,
      proposals,
    };
  }

  return requirement;
};

export const deleteRequirement = async (id, learnerUserId) => {
  const requirement = await prisma.learnerRequirement.findFirst({
    where: {
      id,
      learner: {
        userId: learnerUserId,
      },
    },
  });

  if (!requirement) {
    const error = new Error('Requirement not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.learnerRequirement.delete({ where: { id } });
};
