import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { sendError } from '../utils/responseHandler.js';
import prisma from '../config/db.js';
import { getSupabaseIdentity } from '../modules/auth/supabase-auth.service.js';

export const protect = (req, res, next) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return sendError(res, 'Not authorized', 401);
  }

  const token = bearer.split(' ')[1];

  (async () => {
    try {
      const supabaseIdentity = await getSupabaseIdentity(token);

      if (supabaseIdentity?.email) {
        const appUser = await prisma.user.findUnique({
          where: { email: supabaseIdentity.email },
          select: { id: true, role: true, email: true },
        });

        req.user = {
          userId: appUser?.id || null,
          role: appUser?.role || supabaseIdentity.role || 'LEARNER',
          email: supabaseIdentity.email,
          supabaseUserId: supabaseIdentity.supabaseUserId,
          authProvider: 'supabase',
        };

        return next();
      }

      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload;
      return next();
    } catch (error) {
      return sendError(res, 'Not authorized', 401);
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
