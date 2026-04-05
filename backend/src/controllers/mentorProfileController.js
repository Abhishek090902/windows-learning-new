import prisma from '../config/db.js';
import { emitDataUpdate } from '../utils/socketEmitter.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { syncMentorProfileSkills } from '../utils/skillCatalog.js';
import { buildApprovedMentorWhere } from '../utils/mentorVerification.js';

const mentorProfileInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
    },
  },
  reviews: {
    where: { isActive: true },
    include: {
      learner: {
        include: {
          user: {
            select: {
              name: true,
              profilePicture: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  },
  _count: {
    select: {
      reviews: { where: { isActive: true } },
      sessions: { where: { status: 'COMPLETED' } },
    },
  },
  skills: {
    include: {
      skill: true,
    },
  },
};

const buildProfilePayload = (profile) => {
  if (!profile) return null;

  return {
    ...profile,
    fullName: profile.fullName || profile.user?.name || '',
    profileImage: profile.profileImage || profile.user?.profilePicture || '',
    totalSessions: profile.totalSessions ?? profile._count?.sessions ?? 0,
    totalReviews: profile.totalReviews ?? profile._count?.reviews ?? 0,
    averageRating: profile.averageRating ? Number(profile.averageRating) : 0,
    responseRate: profile.responseRate ? Number(profile.responseRate) : 0,
    completionRate: profile.completionRate ? Number(profile.completionRate) : 0,
    hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : 0,
    reviews: (profile.reviews || []).map((review) => ({
      ...review,
      learnerName: review.learner?.user?.name || 'Learner',
      learnerImage: review.learner?.user?.profilePicture || null,
    })),
    normalizedSkills: (profile.skills || []).map((entry) => entry.skill?.name).filter(Boolean),
  };
};

const getMentorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.mentorProfile.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
      include: mentorProfileInclude,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    return sendSuccess(res, buildProfilePayload(profile), 'Mentor profile retrieved successfully');
  } catch (error) {
    console.error('Get mentor profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch mentor profile' });
  }
};

const getMyMentorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await prisma.mentorProfile.findUnique({
      where: { userId },
      include: mentorProfileInclude,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    return sendSuccess(res, buildProfilePayload(profile), 'My mentor profile retrieved successfully');
  } catch (error) {
    console.error('Get my mentor profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch mentor profile' });
  }
};

const createOrUpdateUserBasics = async (userId, fullName, profileImage) => {
  const userUpdate = {};
  if (fullName) userUpdate.name = fullName;
  if (profileImage) userUpdate.profilePicture = profileImage;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    });
  }
};

const buildMentorProfileWriteData = (body, fallbackName) => {
  const {
    fullName,
    profileImage,
    headline,
    bio,
    location,
    languages,
    skillsData,
    experienceYears,
    currentCompany,
    currentRole,
    pastExperience,
    education,
    hourlyRate,
    currency,
    packageDeals,
    freeConsultation,
    weeklySchedule,
    timeZone,
    responseTime,
    timeOff,
    certifications,
    idDocument,
    workVerification,
  } = body;

  return {
    fullName: fullName || fallbackName || null,
    profileImage: profileImage || null,
    headline: headline || null,
    bio: bio || null,
    location: location || null,
    languages: Array.isArray(languages) ? languages : [],
    skillsData: skillsData || {},
    experienceYears: Number(experienceYears || 0),
    currentCompany: currentCompany || null,
    currentRole: currentRole || null,
    pastExperience: Array.isArray(pastExperience) ? pastExperience : [],
    education: Array.isArray(education) ? education : [],
    hourlyRate: Number(hourlyRate || 0),
    currency: currency || 'INR',
    packageDeals: Array.isArray(packageDeals) ? packageDeals : [],
    freeConsultation: Boolean(freeConsultation),
    weeklySchedule: weeklySchedule || {},
    timeZone: timeZone || 'Asia/Kolkata',
    responseTime: responseTime || null,
    timeOff: Array.isArray(timeOff) ? timeOff : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    idDocument: idDocument || null,
    workVerification: workVerification || null,
    title: headline || null,
    company: currentCompany || null,
    experience: Number(experienceYears || 0),
  };
};

const createMentorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const existingProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
    const profile = existingProfile
      ? await prisma.mentorProfile.update({
          where: { id: existingProfile.id },
          data: buildMentorProfileWriteData(req.body, req.user.name),
          include: mentorProfileInclude,
        })
      : await prisma.mentorProfile.create({
          data: {
            userId,
            ...buildMentorProfileWriteData(req.body, req.user.name),
          },
          include: mentorProfileInclude,
        });

    await syncMentorProfileSkills(profile.id, req.body.skillsData || {});

    const hydratedProfile = await prisma.mentorProfile.findUnique({
      where: { id: profile.id },
      include: mentorProfileInclude,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'MENTOR',
        ...(req.body.fullName ? { name: req.body.fullName } : {}),
        ...(req.body.profileImage ? { profilePicture: req.body.profileImage } : {}),
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mentorProfile: true,
        learnerProfile: true,
        wallet: true,
      },
    });

    const io = req.app.get('io');
    emitDataUpdate(io, userId, 'user');
    emitDataUpdate(io, userId, 'profile');
    emitDataUpdate(io, null, 'mentors');

    return sendSuccess(
      res,
      {
        profile: buildProfilePayload(hydratedProfile),
        user: updatedUser,
      },
      existingProfile ? 'Mentor profile updated successfully' : 'Mentor profile created successfully',
      existingProfile ? 200 : 201,
    );
  } catch (error) {
    console.error('Create mentor profile error:', error);
    return res.status(500).json({ error: 'Failed to create mentor profile' });
  }
};

const updateMentorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const profile = await prisma.mentorProfile.findUnique({ where: { id } });
    if (!profile) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    if (profile.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const updatedProfile = await prisma.mentorProfile.update({
      where: { id },
      data: buildMentorProfileWriteData(req.body, req.user.name),
      include: mentorProfileInclude,
    });

    await syncMentorProfileSkills(id, req.body.skillsData || {});

    const hydratedProfile = await prisma.mentorProfile.findUnique({
      where: { id },
      include: mentorProfileInclude,
    });

    await createOrUpdateUserBasics(userId, req.body.fullName, req.body.profileImage);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mentorProfile: true,
        learnerProfile: true,
        wallet: true,
      },
    });

    const io = req.app.get('io');
    emitDataUpdate(io, userId, 'user');
    emitDataUpdate(io, userId, 'profile');
    emitDataUpdate(io, null, 'mentors');

    return sendSuccess(
      res,
      {
        profile: buildProfilePayload(hydratedProfile || updatedProfile),
        user: updatedUser,
      },
      'Profile updated successfully',
    );
  } catch (error) {
    console.error('Update mentor profile error:', error);
    return res.status(500).json({ error: 'Failed to update mentor profile' });
  }
};

const searchMentors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minRate,
      maxRate,
      experience,
      rating,
      sortBy = 'newest',
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const whereFilters = {
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      whereFilters.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minRate) {
      whereFilters.hourlyRate = { ...(whereFilters.hourlyRate || {}), gte: parseFloat(minRate) };
    }
    if (maxRate) {
      whereFilters.hourlyRate = { ...(whereFilters.hourlyRate || {}), lte: parseFloat(maxRate) };
    }
    if (experience) {
      whereFilters.experienceYears = { gte: parseInt(experience, 10) };
    }
    if (rating) {
      whereFilters.averageRating = { gte: parseFloat(rating) };
    }

    const where = buildApprovedMentorWhere(whereFilters);

    const orderBy = {};
    switch (sortBy) {
      case 'rating':
        orderBy.averageRating = 'desc';
        break;
      case 'experience':
        orderBy.experienceYears = 'desc';
        break;
      case 'rate_low':
        orderBy.hourlyRate = 'asc';
        break;
      case 'rate_high':
        orderBy.hourlyRate = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const mentors = await prisma.mentorProfile.findMany({
      where,
      orderBy,
      skip,
      take,
      include: mentorProfileInclude,
    });

    const total = await prisma.mentorProfile.count({ where });

    return sendSuccess(
      res,
      {
        mentors: mentors.map(buildProfilePayload),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Mentor search results retrieved successfully'
    );
  } catch (error) {
    console.error('Search mentors error:', error);
    return res.status(500).json({ error: 'Failed to search mentors' });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    return sendSuccess(
      res,
      { fileUrl: `/uploads/${req.file.filename}` },
      'File uploaded successfully'
    );
  } catch (error) {
    console.error('Upload file error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
};

export {
  getMentorProfile,
  updateMentorProfile,
  getMyMentorProfile,
  createMentorProfile,
  searchMentors,
  uploadFile,
};
