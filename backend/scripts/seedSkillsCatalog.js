import prisma from '../src/config/db.js';
import { ensureSkillCatalogSeeded, syncMentorProfileSkills, syncLearnerSkills } from '../src/utils/skillCatalog.js';

const main = async () => {
  await ensureSkillCatalogSeeded();

  const mentorProfiles = await prisma.mentorProfile.findMany({
    select: {
      id: true,
      skillsData: true,
    },
  });

  for (const profile of mentorProfiles) {
    await syncMentorProfileSkills(profile.id, profile.skillsData || {});
  }

  const learnerProfiles = await prisma.learnerProfile.findMany({
    include: {
      user: true,
    },
  });

  for (const profile of learnerProfiles) {
    const inferredSkills = [];
    const bio = String(profile.bio || '');
    if (bio) {
      for (const token of bio.split(/[,.\n]/).map((part) => part.trim()).filter(Boolean)) {
        if (token.length <= 40) inferredSkills.push(token);
      }
    }
    await syncLearnerSkills(profile.id, inferredSkills.slice(0, 5));
  }

  const [categories, skills, mentorLinks, learnerLinks] = await Promise.all([
    prisma.category.count(),
    prisma.skill.count(),
    prisma.mentorSkill.count(),
    prisma.learnerSkill.count(),
  ]);

  console.log(JSON.stringify({ categories, skills, mentorLinks, learnerLinks }, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
