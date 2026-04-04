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
  });

  if (!requirement || !requirement.isActive) {
    throw new Error('Requirement not found');
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

export const acceptProposal = async (proposalId) => {
  return await prisma.$transaction(async (tx) => {
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

export const rejectProposal = async (proposalId) => {
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
