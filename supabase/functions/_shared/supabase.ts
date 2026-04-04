import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.9.6';
import { HttpError } from './http.ts';

const getSupabaseUrl = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');

  if (!supabaseUrl) {
    throw new HttpError(500, 'SUPABASE_URL is required');
  }

  return supabaseUrl;
};

const getPublishableKey = () => {
  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ||
    Deno.env.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!publishableKey) {
    throw new HttpError(500, 'SUPABASE_PUBLISHABLE_KEY is required');
  }

  return publishableKey;
};

export const createSupabaseClient = (bearerToken?: string) =>
  createClient(getSupabaseUrl(), getPublishableKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: bearerToken
      ? {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      : undefined,
  });

export const createSupabaseAdmin = () => {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey) {
    throw new HttpError(500, 'SUPABASE_SERVICE_ROLE_KEY is required');
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getSupabaseJwks = () => {
  if (!cachedJwks) {
    const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', getSupabaseUrl());
    cachedJwks = createRemoteJWKSet(jwksUrl);
  }

  return cachedJwks;
};

export const verifySupabaseJwt = async (token: string) => {
  const supabaseUrl = getSupabaseUrl();
  const jwks = getSupabaseJwks();
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `${supabaseUrl}/auth/v1`,
    audience: 'authenticated',
  });

  const email = typeof payload.email === 'string' ? payload.email : null;
  const subject = typeof payload.sub === 'string' ? payload.sub : null;

  if (!email || !subject) {
    throw new HttpError(401, 'Supabase token is missing required claims');
  }

  return {
    id: subject,
    email,
    role: typeof payload.role === 'string' ? payload.role : null,
    metadata:
      typeof payload.user_metadata === 'object' && payload.user_metadata !== null
        ? payload.user_metadata as Record<string, unknown>
        : {},
    claims: payload,
  };
};

export const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token');
  }

  return authHeader.slice('Bearer '.length);
};
