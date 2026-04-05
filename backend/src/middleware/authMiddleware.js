import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { sendError } from '../utils/responseHandler.js';
import { getSupabaseIdentity } from '../modules/auth/supabase-auth.service.js';
import prisma from '../config/db.js';
import { findUserByIdentity } from '../modules/auth/identity.service.js';

const resolveRequestUser = async (token) => {
  const supabaseIdentity = await getSupabaseIdentity(token);

  if (supabaseIdentity?.email) {
    const appUser = await findUserByIdentity(prisma, {
      email: supabaseIdentity.email,
      authProvider: supabaseIdentity.authProvider,
      providerUserId: supabaseIdentity.providerUserId || supabaseIdentity.supabaseUserId,
    }, { allowLegacyFallback: false });

    if (!appUser) {
      return null;
    }

    return {
      userId: appUser.id,
      role: appUser.role || supabaseIdentity.role || 'LEARNER',
      email: supabaseIdentity.email,
      supabaseUserId: supabaseIdentity.supabaseUserId,
      authProvider: supabaseIdentity.authProvider,
      providerUserId: supabaseIdentity.providerUserId || supabaseIdentity.supabaseUserId,
    };
  }

  return jwt.verify(token, config.jwtSecret);
};

export const protect = (req, res, next) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return sendError(res, 'Not authorized', 401);
  }

  const token = bearer.split(' ')[1];

  (async () => {
    try {
      const user = await resolveRequestUser(token);
      if (!user?.userId) {
        return sendError(res, 'Not authorized', 401);
      }

      req.user = user;
      return next();
    } catch (error) {
      return sendError(res, 'Not authorized', 401);
    }
  })();
};

export const optionalAuth = (req, _res, next) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = bearer.split(' ')[1];

  (async () => {
    try {
      req.user = await resolveRequestUser(token);
      return next();
    } catch {
      req.user = null;
      return next();
    }
  })();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden', 403);
    }
    next();
  };
};
