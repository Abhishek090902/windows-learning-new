import { getBearerToken, verifySupabaseJwt } from './supabase.ts';
import { getNeonSql } from './neon.ts';
import { HttpError } from './http.ts';

export type AppRole = 'LEARNER' | 'MENTOR' | 'ADMIN';

export type AuthContext = {
  bearerToken: string;
  supabaseUserId: string;
  email: string;
  appUserId: string;
  role: AppRole;
};

export const requireAuth = async (request: Request): Promise<AuthContext> => {
  const token = getBearerToken(request);
  const identity = await verifySupabaseJwt(token);

  if (!identity.email) {
    throw new HttpError(401, 'Invalid Supabase session');
  }

  const sql = getNeonSql();
  const users = await sql`
    select id, role, email
    from "User"
    where email = ${identity.email}
    limit 1
  `;

  if (!users.length) {
    throw new HttpError(404, 'Authenticated user was not found in Neon');
  }

  return {
    bearerToken: token,
    supabaseUserId: identity.id,
    email: identity.email,
    appUserId: users[0].id,
    role: users[0].role,
  };
};

export const requireRole = (auth: AuthContext, ...roles: AppRole[]) => {
  if (!roles.includes(auth.role)) {
    throw new HttpError(403, 'Forbidden');
  }
};
