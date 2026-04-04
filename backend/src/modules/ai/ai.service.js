import prisma from '../../config/db.js';

const domainGroups = [
  {
    id: 'frontend',
    label: 'Frontend development',
    keywords: ['frontend', 'front end', 'react', 'next', 'ui', 'web', 'javascript', 'typescript'],
  },
  {
    id: 'backend',
    label: 'Backend development',
    keywords: ['backend', 'back end', 'api', 'server', 'node', 'database', 'express', 'system design'],
  },
  {
    id: 'fullstack',
    label: 'Full-stack development',
    keywords: ['fullstack', 'full stack', 'app development', 'software development', 'web development'],
  },
  {
    id: 'data',
    label: 'Data and AI',
    keywords: ['data', 'analytics', 'machine learning', 'ml', 'ai', 'python', 'sql'],
  },
  {
    id: 'design',
    label: 'Design',
    keywords: ['design', 'ux', 'ui', 'figma', 'product design', 'graphic'],
  },
  {
    id: 'cloud',
    label: 'Cloud and DevOps',
    keywords: ['aws', 'cloud', 'devops', 'docker', 'kubernetes', 'terraform'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    keywords: ['marketing', 'seo', 'growth', 'brand', 'content', 'social media'],
  },
  {
    id: 'career',
    label: 'Career growth',
    keywords: ['interview', 'resume', 'career', 'job', 'leadership', 'communication'],
  },
];

const questionBank = {
  frontend_backend: {
    question: 'Do you want to focus on frontend, backend, or full-stack work?',
    options: ['Frontend development', 'Backend development', 'Full-stack development'],
  },
  data_split: {
    question: 'Are you aiming for data analysis, machine learning, or data engineering?',
    options: ['Data analysis', 'Machine learning', 'Data engineering'],
  },
  design_split: {
    question: 'Do you want UI/UX, product design, or graphic design?',
    options: ['UI/UX Design', 'Product Design', 'Graphic Design'],
  },
  build_goal: {
    question: 'Are you trying to build apps, analyze data, or improve your career outcomes?',
    options: ['Build apps', 'Analyze data', 'Career growth'],
  },
  experience: {
    question: 'What level are you targeting right now: beginner, intermediate, or advanced?',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  platform: {
    question: 'Which path feels closer to your goal: web, mobile, cloud, or AI?',
    options: ['Web development', 'Mobile development', 'Cloud and DevOps', 'AI and data'],
  },
};

const normalizeExperienceLevel = (query = '') => {
  const lower = query.toLowerCase();
  if (/(beginner|new to|starting|starter)/.test(lower)) return 'beginner';
  if (/(advanced|senior|expert)/.test(lower)) return 'advanced';
  if (/(intermediate|mid-level)/.test(lower)) return 'intermediate';
  return null;
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const chooseQuestions = (matchedCategoryNames, domainHits, count) => {
  const questions = [];
  const suggestedQueries = [];

  const labels = matchedCategoryNames.map((name) => String(name).toLowerCase());
  const hasWeb = domainHits.some((domain) => ['frontend', 'backend', 'fullstack'].includes(domain.id));
  const hasData = domainHits.some((domain) => domain.id === 'data');
  const hasDesign = domainHits.some((domain) => domain.id === 'design');

  if (hasWeb || labels.some((label) => /development|programming|software/.test(label))) {
    questions.push(questionBank.frontend_backend.question);
    suggestedQueries.push(...questionBank.frontend_backend.options);
  }

  if (hasData || labels.some((label) => /data|ai/.test(label))) {
    questions.push(questionBank.data_split.question);
    suggestedQueries.push(...questionBank.data_split.options);
  }

  if (hasDesign || labels.some((label) => /design/.test(label))) {
    questions.push(questionBank.design_split.question);
    suggestedQueries.push(...questionBank.design_split.options);
  }

  if (!questions.length || count > 15) {
    questions.push(questionBank.build_goal.question);
    suggestedQueries.push(...questionBank.build_goal.options);
  }

  if (count > 15) {
    questions.push(questionBank.platform.question);
    suggestedQueries.push(...questionBank.platform.options);
  }

  questions.push(questionBank.experience.question);
  suggestedQueries.push(...questionBank.experience.options);

  return {
    questions: unique(questions).slice(0, count > 15 ? 4 : 2),
    suggestedQueries: unique(suggestedQueries).slice(0, count > 15 ? 8 : 5),
  };
};

const createWeights = (skills) =>
  skills.map((skill, index) => ({
    skill,
    weight: index === 0 ? 0.38 : index === 1 ? 0.24 : index === 2 ? 0.16 : index < 5 ? 0.1 : 0.06,
  }));

const scoreSkillMatch = (skill, query) => {
  const lowerQuery = query.toLowerCase().trim();
  const queryTokens = lowerQuery.split(/[^a-z0-9+.#/-]+/).filter(Boolean);
  const names = [
    skill.name,
    skill.slug,
    skill.category?.name,
    ...(skill.keywords || []),
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  let score = 0;

  for (const value of names) {
    if (value === lowerQuery) score += 12;
    if (value.includes(lowerQuery) || lowerQuery.includes(value)) score += 6;

    for (const token of queryTokens) {
      if (value === token) score += 5;
      else if (value.includes(token)) score += 2;
    }
  }

  for (const domain of domainGroups) {
    if (domain.keywords.some((keyword) => lowerQuery.includes(keyword))) {
      const categoryName = String(skill.category?.name || '').toLowerCase();
      const skillName = String(skill.name || '').toLowerCase();
      if (domain.keywords.some((keyword) => categoryName.includes(keyword) || skillName.includes(keyword))) {
        score += 4;
      }
    }
  }

  return score;
};

const buildInterpretation = (query, matchedCategoryNames) => {
  if (matchedCategoryNames.length) {
    return `This looks like a search around ${matchedCategoryNames.slice(0, 2).join(' and ')}.`;
  }

  return `This looks like a broad search related to "${query}".`;
};

export const processSearchIntent = async (query) => {
  const activeSkills = await prisma.skill.findMany({
    where: { isActive: true, deletedAt: null },
    select: {
      name: true,
      slug: true,
      keywords: true,
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  const scoredSkills = activeSkills
    .map((skill) => ({ ...skill, score: scoreSkillMatch(skill, query) }))
    .filter((skill) => skill.score > 0)
    .sort((a, b) => b.score - a.score);

  const lowerQuery = query.toLowerCase();
  const domainHits = domainGroups.filter((domain) =>
    domain.keywords.some((keyword) => lowerQuery.includes(keyword)),
  );

  const fallbackSkills = !scoredSkills.length
    ? activeSkills.filter((skill) =>
        domainHits.some((domain) =>
          domain.keywords.some((keyword) =>
            String(skill.category?.name || '').toLowerCase().includes(keyword) ||
            String(skill.name || '').toLowerCase().includes(keyword),
          ),
        ),
      )
    : [];

  const matchedSkills = scoredSkills.length ? scoredSkills : fallbackSkills.map((skill) => ({ ...skill, score: 1 }));
  const matchedCategoryNames = unique(matchedSkills.map((skill) => skill.category?.name));
  const matchSize = matchedSkills.length;
  const interpretation = buildInterpretation(query, matchedCategoryNames);
  const experienceLevel = normalizeExperienceLevel(query);
  const { questions, suggestedQueries } = chooseQuestions(matchedCategoryNames, domainHits, matchSize);

  if (matchSize > 15) {
    return {
      interpretation,
      match_size: matchSize,
      action: 'questions_first',
      questions,
      suggested_queries: suggestedQueries,
      skills: [],
      required_skills: [],
      weighted_skills: [],
      suggested_domain: matchedCategoryNames[0] || domainHits[0]?.label || 'General',
      intent: 'discovery',
      experience_level: experienceLevel,
      problem_summary: 'This search is broad, so I should narrow it before recommending skills or mentors.',
      next_step: 'Answer one of the narrowing prompts to uncover the most relevant path.',
      isFallback: true,
    };
  }

  const topSkills = matchedSkills.slice(0, matchSize <= 8 ? 8 : 7).map((skill) => ({
    name: skill.name,
    category: skill.category?.name || 'General',
  }));
  const topSkillNames = topSkills.map((skill) => skill.name);

  if (matchSize >= 9) {
    return {
      interpretation,
      match_size: matchSize,
      action: 'skills_with_questions',
      questions,
      suggested_queries: suggestedQueries,
      skills: topSkills,
      required_skills: topSkillNames,
      weighted_skills: createWeights(topSkillNames),
      suggested_domain: matchedCategoryNames[0] || domainHits[0]?.label || 'General',
      intent: 'discovery',
      experience_level: experienceLevel,
      problem_summary: 'I found several relevant skills, so here are the strongest matches plus a couple of questions to narrow them further.',
      next_step: 'Pick one of the follow-up directions if you want a more focused mentor shortlist.',
      isFallback: true,
    };
  }

  return {
    interpretation,
    match_size: matchSize,
    action: 'skills',
    questions: [],
    suggested_queries: [],
    skills: topSkills,
    required_skills: topSkillNames.length ? topSkillNames : [query],
    weighted_skills: createWeights(topSkillNames.length ? topSkillNames : [query]),
    suggested_domain: matchedCategoryNames[0] || domainHits[0]?.label || 'General',
    intent: 'discovery',
    experience_level: experienceLevel,
    problem_summary: topSkillNames.length
      ? 'These are the most relevant skills for the direction you described.'
      : `Showing the closest available matches for "${query}".`,
    next_step: 'Choose a mentor from these skills or refine the search if you want a narrower match.',
    isFallback: true,
  };
};
