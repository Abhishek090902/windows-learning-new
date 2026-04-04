import { corsHeaders } from '../_shared/cors.ts';
import { getBearerToken, verifySupabaseJwt } from '../_shared/supabase.ts';
import { getNeonSql } from '../_shared/neon.ts';

const getStringValue = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const getRole = (metadata: Record<string, unknown>) => {
  const role = getStringValue(metadata.role, getStringValue(metadata.user_role, 'LEARNER')).toUpperCase();
  return role === 'MENTOR' ? 'MENTOR' : 'LEARNER';
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = getBearerToken(request);
    const identity = await verifySupabaseJwt(token);

    if (!identity.email) {
      return new Response(JSON.stringify({ error: 'Invalid Supabase session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sql = getNeonSql();
    const metadata = identity.metadata || {};
    const email = identity.email;
    const name = getStringValue(
      metadata.full_name,
      getStringValue(metadata.name, email.split('@')[0]),
    );
    const role = getRole(metadata);
    const password = `supabase:${identity.id}`;

    const existingUsers = await sql`
      select id, role from "User" where email = ${email} limit 1
    `;

    let userId = existingUsers[0]?.id;

    if (!userId) {
      userId = crypto.randomUUID();
      const insertedUsers = await sql`
        insert into "User" (id, email, name, password, role, "createdAt", "updatedAt", "isActive")
        values (${userId}, ${email}, ${name}, ${password}, ${role}::"Role", now(), now(), true)
        returning id
      `;
      userId = insertedUsers[0].id;

      await sql`
        insert into "Wallet" (id, "userId", balance, "heldBalance", "isActive", "createdAt", "updatedAt")
        values (${crypto.randomUUID()}, ${userId}, 0, 0, true, now(), now())
        on conflict ("userId") do nothing
      `;

      await sql`
        insert into "NotificationSetting" (id, "userId", "newMessages", "sessionRequests", "newProposals", "isActive", "createdAt", "updatedAt")
        values (${crypto.randomUUID()}, ${userId}, true, true, true, true, now(), now())
        on conflict ("userId") do nothing
      `;
    } else if (role === 'MENTOR' && existingUsers[0]?.role === 'LEARNER') {
      await sql`
        update "User" set role = ${role}::"Role", "updatedAt" = now() where id = ${userId}
      `;
    }

    if (role === 'MENTOR') {
      await sql`
        insert into "MentorProfile" (id, "userId", "hourly_rate", currency, "time_zone", "verification_status", "isVerified", "isActive", "total_sessions", "total_students", "total_reviews", "createdAt", "updatedAt")
        values (${crypto.randomUUID()}, ${userId}, 0, 'INR', 'Asia/Kolkata', 'pending', false, true, 0, 0, 0, now(), now())
        on conflict ("userId") do nothing
      `;
    } else {
      await sql`
        insert into "LearnerProfile" (id, "userId", "isActive")
        values (${crypto.randomUUID()}, ${userId}, true)
        on conflict ("userId") do nothing
      `;
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
