import prisma from '../../config/db.js';
import { ensureSkillCatalogSeeded } from '../../utils/skillCatalog.js';

export const getAllSkills = async () => {
  await ensureSkillCatalogSeeded();

  return prisma.skill.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      category: true,
      _count: {
        select: {
          mentors: true,
          learners: true,
        },
      },
    },
    orderBy: [
      { isTrending: 'desc' },
      { name: 'asc' },
    ],
  });
};

export const getSkillsGroupedByCategory = async () => {
  await ensureSkillCatalogSeeded();

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      skills: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              mentors: true,
              learners: true,
            },
          },
        },
        orderBy: [
          { isTrending: 'desc' },
          { name: 'asc' },
        ],
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories;
};
