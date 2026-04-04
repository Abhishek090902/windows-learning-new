import { ensureSkillCatalogSeeded } from '../../utils/skillCatalog.js';
import prisma from '../../config/db.js';

export const getAllCategories = async () => {
  await ensureSkillCatalogSeeded();

  return await prisma.category.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      _count: {
        select: { skills: true }
      }
    },
    orderBy: { name: 'asc' },
  });
};

export const getCategoryById = async (id) => {
  await ensureSkillCatalogSeeded();

  return await prisma.category.findUnique({
    where: { id },
    include: {
      skills: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: { name: 'asc' },
      }
    }
  });
};
