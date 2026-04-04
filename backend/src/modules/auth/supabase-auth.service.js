import prisma from '../../config/db.js';
import { getSupabaseAdmin } from '../../config/supabase.js';
import config from '../../config/env.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const getRoleFromMetadata = (metadata = {}) => {
  const requestedRole = String(metadata.role || metadata.user_role || 'LEARNER').toUpperCase();
  return requestedRole === 'MENTOR' ? 'MENTOR' : 'LEARNER';
};

let projectJwks = null;

const getProjectJwks = () => {
  if (!config.supabaseUrl) {
    return null;
  }

  if (!projectJwks) {
    projectJwks = createRemoteJWKSet(new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`));
  }

  return projectJwks;
};

export const getSupabaseIdentity = async (token) => {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    const jwks = getProjectJwks();

    if (!jwks) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${config.supabaseUrl}/auth/v1`,
      });

      return {
        supabaseUserId: payload.sub,
        email: payload.email,
        name:
          payload.user_metadata?.full_name ||
          payload.user_metadata?.name ||
          payload.email?.split('@')[0] ||
          null,
        role: getRoleFromMetadata(payload.user_metadata || {}),
        metadata: payload.user_metadata || {},
      };
    } catch {
      return null;
    }
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return {
    supabaseUserId: data.user.id,
    email: data.user.email,
    name:
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0] ||
      null,
    role: getRoleFromMetadata(data.user.user_metadata),
    metadata: data.user.user_metadata || {},
  };
};

export const syncSupabaseUser = async (identity) => {
  if (!identity?.email) {
    throw new Error('Supabase user email is required');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: identity.email },
    include: {
      learnerProfile: true,
      mentorProfile: true,
      wallet: true,
      notificationSetting: true,
    },
  });

  const role = identity.role || 'LEARNER';

  if (!existingUser) {
    const createdUser = await prisma.user.create({
      data: {
        email: identity.email,
        name: identity.name,
        password: `supabase:${identity.supabaseUserId}`,
        role,
        ...(role === 'MENTOR'
          ? { mentorProfile: { create: { hourlyRate: 0 } } }
          : { learnerProfile: { create: {} } }),
        notificationSetting: { create: {} },
        wallet: { create: {} },
      },
      include: {
        learnerProfile: true,
        mentorProfile: true,
        wallet: true,
      },
    });

    return createdUser;
  }

  const updateData = {
    ...(identity.name && !existingUser.name ? { name: identity.name } : {}),
    ...(role === 'MENTOR' && existingUser.role === 'LEARNER' ? { role: 'MENTOR' } : {}),
    ...(role === 'MENTOR' && !existingUser.mentorProfile
      ? { mentorProfile: { create: { hourlyRate: 0 } } }
      : {}),
    ...(role === 'LEARNER' && !existingUser.learnerProfile
      ? { learnerProfile: { create: {} } }
      : {}),
    ...(!existingUser.wallet ? { wallet: { create: {} } } : {}),
    ...(!existingUser.notificationSetting ? { notificationSetting: { create: {} } } : {}),
  };

  if (Object.keys(updateData).length === 0) {
    return existingUser;
  }

  return prisma.user.update({
    where: { id: existingUser.id },
    data: updateData,
    include: {
      learnerProfile: true,
      mentorProfile: true,
      wallet: true,
    },
  });
};
