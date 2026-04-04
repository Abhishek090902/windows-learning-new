import { neon } from 'npm:@neondatabase/serverless@1.0.1';

export const getNeonSql = () => {
  const databaseUrl = Deno.env.get('DATABASE_URL') || Deno.env.get('NEON_DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('Neon DATABASE_URL is required');
  }

  return neon(databaseUrl);
};
