import prisma from '../config/db.js';

const predefinedCategories = [
  {
    name: 'Programming',
    slug: 'programming',
    icon: 'Code',
    skills: [
      ['JavaScript', ['javascript', 'js', 'frontend', 'web']],
      ['TypeScript', ['typescript', 'ts', 'frontend', 'backend']],
      ['React', ['react', 'frontend', 'spa']],
      ['Next.js', ['next.js', 'next', 'react framework']],
      ['Node.js', ['node.js', 'node', 'backend', 'api']],
      ['Python', ['python', 'backend', 'automation', 'data']],
      ['Java', ['java', 'backend', 'spring']],
      ['C++', ['c++', 'cpp', 'systems']],
      ['PHP', ['php', 'laravel', 'backend']],
      ['Go', ['go', 'golang', 'backend']],
      ['Rust', ['rust', 'systems', 'performance']],
    ],
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    icon: 'BarChart3',
    skills: [
      ['Data Science', ['data science', 'analytics', 'statistics']],
      ['Machine Learning', ['machine learning', 'ml', 'ai']],
      ['Data Analysis', ['data analysis', 'analytics', 'reporting']],
      ['SQL', ['sql', 'database', 'query']],
      ['Power BI', ['power bi', 'bi', 'dashboards']],
      ['Tableau', ['tableau', 'visualization', 'dashboards']],
      ['Deep Learning', ['deep learning', 'neural networks', 'ai']],
      ['Statistics', ['statistics', 'probability', 'analytics']],
    ],
  },
  {
    name: 'Design',
    slug: 'design',
    icon: 'Palette',
    skills: [
      ['UI/UX Design', ['ui/ux design', 'ux', 'ui', 'product design']],
      ['Graphic Design', ['graphic design', 'branding', 'visual']],
      ['Figma', ['figma', 'design systems', 'prototype']],
      ['Adobe Photoshop', ['photoshop', 'editing', 'design']],
      ['Adobe Illustrator', ['illustrator', 'vector', 'branding']],
      ['Motion Design', ['motion design', 'animation', 'after effects']],
    ],
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    icon: 'TrendingUp',
    skills: [
      ['Digital Marketing', ['digital marketing', 'marketing', 'growth']],
      ['SEO', ['seo', 'search engine optimization']],
      ['Content Marketing', ['content marketing', 'content strategy']],
      ['Performance Marketing', ['performance marketing', 'ads', 'paid marketing']],
      ['Social Media Marketing', ['social media marketing', 'social media', 'instagram']],
      ['Brand Strategy', ['brand strategy', 'branding', 'marketing']],
    ],
  },
  {
    name: 'Career',
    slug: 'career',
    icon: 'Briefcase',
    skills: [
      ['Product Management', ['product management', 'product']],
      ['Interview Preparation', ['interview preparation', 'interviews', 'career']],
      ['Resume Building', ['resume', 'cv', 'career']],
      ['Leadership', ['leadership', 'management', 'team lead']],
      ['Public Speaking', ['public speaking', 'communication', 'presentation']],
      ['Freelancing', ['freelancing', 'client work', 'independent']],
    ],
  },
  {
    name: 'Writing',
    slug: 'writing',
    icon: 'PenTool',
    skills: [
      ['Content Writing', ['content writing', 'writing', 'copy']],
      ['Technical Writing', ['technical writing', 'documentation']],
      ['Copywriting', ['copywriting', 'sales copy']],
      ['Blog Writing', ['blog writing', 'blogging', 'content']],
      ['Storytelling', ['storytelling', 'narrative', 'creative']],
      ['Editing', ['editing', 'proofreading', 'copy editing']],
    ],
  },
  {
    name: 'Cloud & DevOps',
    slug: 'cloud-devops',
    icon: 'TrendingUp',
    skills: [
      ['AWS', ['aws', 'cloud', 'amazon web services']],
      ['Docker', ['docker', 'containers', 'devops']],
      ['Kubernetes', ['kubernetes', 'k8s', 'containers']],
      ['CI/CD', ['ci/cd', 'continuous integration', 'deployment']],
      ['Terraform', ['terraform', 'infrastructure as code', 'iac']],
      ['Linux', ['linux', 'server', 'bash']],
    ],
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    icon: 'Code',
    skills: [
      ['React Native', ['react native', 'mobile', 'cross platform']],
      ['Flutter', ['flutter', 'dart', 'mobile']],
      ['Android Development', ['android', 'kotlin', 'mobile']],
      ['iOS Development', ['ios', 'swift', 'mobile']],
      ['Kotlin', ['kotlin', 'android', 'mobile']],
      ['Swift', ['swift', 'ios', 'mobile']],
    ],
  },
  {
    name: 'Business & Finance',
    slug: 'business-finance',
    icon: 'Briefcase',
    skills: [
      ['Business Strategy', ['business strategy', 'strategy', 'growth']],
      ['Finance', ['finance', 'money management', 'analysis']],
      ['Accounting', ['accounting', 'bookkeeping', 'finance']],
      ['Sales', ['sales', 'closing', 'prospecting']],
      ['Entrepreneurship', ['entrepreneurship', 'startup', 'business']],
      ['Operations', ['operations', 'process', 'systems']],
    ],
  },
  {
    name: 'AI & Automation',
    slug: 'ai-automation',
    icon: 'BarChart3',
    skills: [
      ['Generative AI', ['generative ai', 'gpt', 'llm']],
      ['Prompt Engineering', ['prompt engineering', 'prompts', 'ai']],
      ['AI Agents', ['ai agents', 'automation', 'agentic']],
      ['Automation', ['automation', 'workflow', 'no code']],
      ['MLOps', ['mlops', 'machine learning operations', 'deployment']],
      ['Computer Vision', ['computer vision', 'image processing', 'vision']],
    ],
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    icon: 'Code',
    skills: [
      ['Network Security', ['network security', 'security', 'networks']],
      ['Ethical Hacking', ['ethical hacking', 'penetration testing', 'security']],
      ['Security Operations', ['soc', 'security operations', 'incident response']],
      ['Cloud Security', ['cloud security', 'security', 'aws security']],
      ['Risk Management', ['risk management', 'compliance', 'security']],
      ['Identity & Access Management', ['iam', 'identity', 'access management']],
    ],
  },
  {
    name: 'Languages',
    slug: 'languages',
    icon: 'PenTool',
    skills: [
      ['English Speaking', ['english speaking', 'english', 'communication']],
      ['Business English', ['business english', 'english', 'professional']],
      ['Hindi', ['hindi', 'language', 'speaking']],
      ['Spanish', ['spanish', 'language', 'speaking']],
      ['German', ['german', 'language', 'speaking']],
      ['French', ['french', 'language', 'speaking']],
    ],
  },
];

const defaultCategory = {
  name: 'General',
  slug: 'general',
  icon: 'Code',
};

export const slugifySkill = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const findPredefinedCategoryForSkill = (skillName) => {
  const lower = skillName.toLowerCase();
  for (const category of predefinedCategories) {
    if (category.skills.some(([name, keywords]) => name.toLowerCase() === lower || keywords.some((keyword) => lower.includes(keyword)))) {
      return category;
    }
  }
  return null;
};

export const ensureSkillCatalogSeeded = async () => {
  for (const category of predefinedCategories) {
    const dbCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        icon: category.icon,
        isActive: true,
        deletedAt: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
      },
    });

    for (const [skillName, keywords] of category.skills) {
      await prisma.skill.upsert({
        where: { slug: slugifySkill(skillName) },
        update: {
          name: skillName,
          keywords,
          categoryId: dbCategory.id,
          isActive: true,
          deletedAt: null,
        },
        create: {
          name: skillName,
          slug: slugifySkill(skillName),
          keywords,
          categoryId: dbCategory.id,
        },
      });
    }
  }
};

export const ensureSkillRecord = async (skillName) => {
  const trimmed = String(skillName || '').trim();
  if (!trimmed) return null;

  await ensureSkillCatalogSeeded();

  const predefinedCategory = findPredefinedCategoryForSkill(trimmed);
  const category = predefinedCategory
    ? await prisma.category.findUnique({ where: { slug: predefinedCategory.slug } })
    : await prisma.category.upsert({
        where: { slug: defaultCategory.slug },
        update: {
          name: defaultCategory.name,
          icon: defaultCategory.icon,
          isActive: true,
          deletedAt: null,
        },
        create: defaultCategory,
      });

  return prisma.skill.upsert({
    where: { slug: slugifySkill(trimmed) },
    update: {
      name: trimmed,
      categoryId: category.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: trimmed,
      slug: slugifySkill(trimmed),
      keywords: [slugifySkill(trimmed).replace(/-/g, ' ')].filter(Boolean),
      categoryId: category.id,
    },
  });
};

export const syncMentorProfileSkills = async (mentorProfileId, skillsData = {}) => {
  await ensureSkillCatalogSeeded();

  const skillNames = Object.keys(skillsData || {}).map((skill) => skill.trim()).filter(Boolean);
  const desiredSkills = [];

  for (const skillName of skillNames) {
    const skill = await ensureSkillRecord(skillName);
    if (skill) desiredSkills.push(skill);
  }

  await prisma.mentorSkill.deleteMany({ where: { mentorId: mentorProfileId } });

  if (desiredSkills.length) {
    await prisma.mentorSkill.createMany({
      data: desiredSkills.map((skill) => ({
        mentorId: mentorProfileId,
        skillId: skill.id,
      })),
      skipDuplicates: true,
    });
  }
};

export const syncLearnerSkills = async (learnerProfileId, skills = []) => {
  await ensureSkillCatalogSeeded();

  const desiredSkills = [];
  for (const skillName of skills.map((skill) => String(skill).trim()).filter(Boolean)) {
    const skill = await ensureSkillRecord(skillName);
    if (skill) desiredSkills.push(skill);
  }

  await prisma.learnerSkill.deleteMany({ where: { learnerId: learnerProfileId } });

  if (desiredSkills.length) {
    await prisma.learnerSkill.createMany({
      data: desiredSkills.map((skill) => ({
        learnerId: learnerProfileId,
        skillId: skill.id,
      })),
      skipDuplicates: true,
    });
  }
};
