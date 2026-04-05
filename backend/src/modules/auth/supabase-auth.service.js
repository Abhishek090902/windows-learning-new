import prisma from '../../config/db.js';
import { getSupabaseAdmin } from '../../config/supabase.js';
import config from '../../config/env.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AUTH_PROVIDERS, claimLegacyIdentity, findUserByIdentity, normalizeEmail } from './identity.service.js';

const getRoleFromMetadata = (metadata = {}) => {
  const requestedRole = String(metadata.role || metadata.user_role || 'LEARNER').toUpperCase();
  return requestedRole === 'MENTOR' ? 'MENTOR' : 'LEARNER';
};

const getSupabaseProvider = (payload = {}) => {
  const provider = payload.app_metadata?.provider || payload.user_metadata?.provider || 'email';
  return provider === 'email' ? AUTH_PROVIDERS.SUPABASE : AUTH_PROVIDERS.SUPABASE;
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
        email: normalizeEmail(payload.email),
        name:
          payload.user_metadata?.full_name ||
          payload.user_metadata?.name ||
          payload.email?.split('@')[0] ||
          null,
        role: getRoleFromMetadata(payload.user_metadata || {}),
        authProvider: getSupabaseProvider(payload),
        providerUserId: payload.sub,
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
    email: normalizeEmail(data.user.email),
    name:
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0] ||
      null,
    role: getRoleFromMetadata(data.user.user_metadata),
    authProvider: AUTH_PROVIDERS.SUPABASE,
    providerUserId: data.user.id,
    metadata: data.user.user_metadata || {},
  };
};

export const syncSupabaseUser = async (identity) => {
  if (!identity?.email) {
    throw new Error('Supabase user email is required');
  }

  const identityLookup = {
    email: identity.email,
    authProvider: identity.authProvider || AUTH_PROVIDERS.SUPABASE,
    providerUserId: identity.providerUserId || identity.supabaseUserId,
  };

  let existingUser = await findUserByIdentity(prisma, identityLookup);

  if (existingUser?.authProvider === AUTH_PROVIDERS.LEGACY) {
    existingUser = await claimLegacyIdentity(prisma, existingUser.id, identityLookup, {
      name: identity.name,
    });
  } else if (existingUser) {
    existingUser = await prisma.user.findUnique({
      where: { id: existingUser.id },
      include: {
        learnerProfile: true,
        mentorProfile: true,
        wallet: true,
        notificationSetting: true,
      },
    });
  }

  const role = identity.role || 'LEARNER';

  if (!existingUser) {
    const createdUser = await prisma.user.create({
      data: {
        email: normalizeEmail(identity.email),
        authProvider: identityLookup.authProvider,
        providerUserId: identityLookup.providerUserId,
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
    ...(identity.email && existingUser.email !== normalizeEmail(identity.email)
      ? { email: normalizeEmail(identity.email) }
      : {}),
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
