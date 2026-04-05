import prisma from '../../config/db.js';

export const createProposal = async (mentorId, data) => {
  const { requirementId, coverLetter, proposedRate } = data;
  const user = await prisma.user.findUnique({
    where: { id: mentorId },
    include: { mentorProfile: true }
  });

  if (!user?.mentorProfile) {
    throw new Error('Mentor profile not found');
  }

  const requirement = await prisma.learnerRequirement.findUnique({
    where: { id: requirementId },
    include: {
      learner: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!requirement || !requirement.isActive) {
    throw new Error('Requirement not found');
  }

  if (requirement.learner?.userId === mentorId) {
    throw new Error('You cannot submit a proposal to your own requirement');
  }

  const existingProposal = await prisma.proposal.findFirst({
    where: {
      mentorId: user.mentorProfile.id,
      requirementId,
      isActive: true,
    },
  });

  if (existingProposal) {
    throw new Error('You already submitted a proposal for this request');
  }

  return await prisma.proposal.create({
    data: {
      mentorId: user.mentorProfile.id,
      requirementId,
      coverLetter,
      proposedRate: parseFloat(proposedRate)
    },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      requirement: {
        include: {
          learner: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });
};

export const getMentorProposals = async (mentorId) => {
  const user = await prisma.user.findUnique({
    where: { id: mentorId },
    include: { mentorProfile: true }
  });

  if (!user?.mentorProfile) {
    return [];
  }

  return await prisma.proposal.findMany({
    where: { mentorId: user.mentorProfile.id },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      requirement: {
        include: {
          learner: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getLearnerOwnedProposal = async (tx, proposalId, learnerUserId) => {
  const proposal = await tx.proposal.findFirst({
    where: {
      id: proposalId,
      isActive: true,
      requirement: {
        learner: {
          userId: learnerUserId,
        },
      },
    },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      requirement: {
        include: {
          learner: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!proposal) {
    const error = new Error('Proposal not found');
    error.statusCode = 404;
    throw error;
  }

  return proposal;
};

export const acceptProposal = async (proposalId, learnerUserId) => {
  return await prisma.$transaction(async (tx) => {
    await getLearnerOwnedProposal(tx, proposalId, learnerUserId);

    const proposal = await tx.proposal.update({
      where: { id: proposalId },
      data: { isAccepted: true },
      include: {
        mentor: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        requirement: {
          include: {
            learner: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    const session = await tx.session.create({
      data: {
        mentorId: proposal.mentorId,
        learnerId: proposal.requirement.learnerId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        status: 'CONFIRMED',
        topic: proposal.requirement.title,
        amount: proposal.proposedRate,
        meetingLink: 'https://meet.jit.si/' + proposal.id,
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

    return { proposal, session };
  });
};

export const rejectProposal = async (proposalId, learnerUserId) => {
  await getLearnerOwnedProposal(prisma, proposalId, learnerUserId);

  return await prisma.proposal.update({
    where: { id: proposalId },
    data: { isAccepted: false, isActive: false },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      requirement: {
        include: {
          learner: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });
};
