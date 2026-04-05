import prisma from '../../config/db.js';
import { buildApprovedMentorWhere } from '../../utils/mentorVerification.js';

export const getAllMentors = async (filters) => {
  const { skill, search, category, minPrice, maxPrice, page = 1, limit = 10, sortBy = 'rating' } = filters;
  const normalizedSearch = (search || skill || '').trim();

  const where = buildApprovedMentorWhere({
    isActive: true,
    deletedAt: null,
    ...(minPrice || maxPrice ? {
      hourlyRate: {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      }
    } : {}),
    ...(normalizedSearch ? {
      OR: [
        {
          user: {
            name: { contains: normalizedSearch, mode: 'insensitive' },
          },
        },
        {
          headline: { contains: normalizedSearch, mode: 'insensitive' },
        },
        {
          bio: { contains: normalizedSearch, mode: 'insensitive' },
        },
        {
          skills: {
            some: {
              skill: {
                OR: [
                  { name: { contains: normalizedSearch, mode: 'insensitive' } },
                  { keywords: { has: normalizedSearch.toLowerCase() } },
                ],
              },
            },
          },
        },
      ],
    } : {}),
    ...(category ? {
      skills: {
        some: {
          skill: {
            category: {
              OR: [
                { id: category },
                { slug: category },
              ],
            },
          },
        },
      },
    } : {}),
  });

  const orderBy = sortBy === 'price_asc' ? { hourlyRate: 'asc' } :
                 sortBy === 'price_desc' ? { hourlyRate: 'desc' } :
                 sortBy === 'newest' ? { createdAt: 'desc' } :
                 { reviews: { _count: 'desc' } };

  return await prisma.mentorProfile.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      skills: { include: { skill: true } },
      reviews: true,
      _count: { select: { reviews: true } }
    },
    orderBy,
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });
};

export const getMentorById = async (id) => {
  return await prisma.mentorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      skills: { include: { skill: true } },
      reviews: {
        include: {
          learner: { include: { user: { select: { name: true } } } },
        },
      },
      availability: true,
    },
  });
};

export const updateMentorAvailability = async (userId, availabilityData) => {
  const mentor = await prisma.mentorProfile.findUnique({ where: { userId } });

  if (!mentor) throw new Error('Mentor profile not found');

  const { schedule } = availabilityData;
  const normalizedSchedule = Object.fromEntries(
    Object.entries(schedule || {}).map(([day, data]) => [
      day.toLowerCase(),
      data?.active && data?.start && data?.end ? [`${data.start}-${data.end}`] : [],
    ])
  );

  return await prisma.mentorProfile.update({
    where: { id: mentor.id },
    data: {
      weeklySchedule: normalizedSchedule,
    },
  });
};

export const saveMentor = async (userId, mentorId) => {
  const learner = await prisma.learnerProfile.findUnique({
    where: { userId },
  });

  return await prisma.savedMentor.create({
    data: { learnerId: learner.id, mentorId },
  });
};

export const getSavedMentors = async (userId) => {
  const learner = await prisma.learnerProfile.findUnique({
    where: { userId },
  });

  return await prisma.savedMentor.findMany({
    where: { learnerId: learner.id },
    include: {
      mentor: {
        include: {
          user: { select: { name: true } },
          skills: { include: { skill: true } },
        },
      },
    },
  });
};
