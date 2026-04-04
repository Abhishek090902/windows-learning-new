import express from 'express';
import { processSearchIntent } from './ai.service.js';
import prisma from '../../config/db.js';

const router = express.Router();

const mentorInclude = {
  user: { select: { name: true, email: true } },
  skills: { include: { skill: true } },
  reviews: true,
  _count: { select: { reviews: true } },
};

const buildFallbackWhere = (query, skills = []) => ({
  isVerified: true,
  isActive: true,
  deletedAt: null,
  OR: [
    {
      user: {
        name: { contains: query, mode: 'insensitive' },
      },
    },
    {
      headline: { contains: query, mode: 'insensitive' },
    },
    {
      bio: { contains: query, mode: 'insensitive' },
    },
    {
      skills: {
        some: {
          skill: {
            name: { contains: query, mode: 'insensitive' },
          },
        },
      },
    },
    ...(skills.length
      ? [{
          skills: {
            some: {
              skill: {
                name: { in: skills },
              },
            },
          },
        }]
      : []),
  ],
});

// Calculate mentor score based on weighted skills
const calculateMentorScore = (mentor, weightedSkills, parsedExperienceLevel) => {
  let skillScore = 0;
  
  for (const ws of weightedSkills) {
    if (mentor.skills && mentor.skills.map(s => s?.skill?.name).includes(ws.skill)) {
      skillScore += ws.weight;
    }
  }
  
  const experienceScore = parsedExperienceLevel ? 0.8 : 0.5;
  const avgRating = mentor.reviews?.length
    ? mentor.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / mentor.reviews.length
    : 0;
  const ratingScore = avgRating ? avgRating / 5 : 0.5;
  const availabilityScore = mentor.weeklySchedule && Object.keys(mentor.weeklySchedule || {}).length ? 1 : 0.4;
  
  return (skillScore * 0.6) + (experienceScore * 0.15) + (ratingScore * 0.15) + (availabilityScore * 0.1);
};

router.post('/search-intent', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log('Processing search intent for:', query);
    
    // Process with Pollinations.AI
    const aiOutput = await processSearchIntent(query);
    
    const { required_skills, weighted_skills, experience_level, action } = aiOutput;
    let mentors = [];

    if (action !== 'questions_first') {
      mentors = await prisma.mentorProfile.findMany({
        where: buildFallbackWhere(query, required_skills || []),
        include: mentorInclude,
      });

      if (!mentors.length) {
        mentors = await prisma.mentorProfile.findMany({
          where: buildFallbackWhere(query, []),
          include: mentorInclude,
        });
      }

      mentors = mentors.map(mentor => ({
        ...mentor,
        score: calculateMentorScore(mentor, weighted_skills || [], experience_level),
        matchedSkills: (weighted_skills || [])
          .filter(ws => mentor.skills && mentor.skills.map(s => s?.skill?.name).includes(ws.skill))
          .map(ws => ws.skill)
      }));

      mentors.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    res.json({ mentors, aiOutput });
    
  } catch (error) {
    console.error('Error in search-intent route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
