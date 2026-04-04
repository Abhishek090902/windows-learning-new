import { corsHeaders } from '../_shared/cors.ts';
import { getBearerToken, verifySupabaseJwt } from '../_shared/supabase.ts';
import { getNeonSql } from '../_shared/neon.ts';

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
    const result = await sql`
      select 
        u.id,
        u.email,
        u.name,
        u.role,
        u."profilePicture",
        lp.id as "learnerProfileId",
        lp.bio as "learnerBio",
        lp."experienceLevel",
        mp.id as "mentorProfileId",
        mp.bio as "mentorBio",
        mp.headline,
        mp."verification_status" as "verificationStatus"
      from "User" u
      left join "LearnerProfile" lp on lp."userId" = u.id
      left join "MentorProfile" mp on mp."userId" = u.id
      where u.email = ${identity.email}
      limit 1
    `;

    if (!result.length) {
      return new Response(JSON.stringify({ error: 'User not found in Neon' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const row = result[0];
    return new Response(JSON.stringify({
      data: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        profilePicture: row.profilePicture,
        learnerProfile: row.learnerProfileId
          ? {
              id: row.learnerProfileId,
              bio: row.learnerBio,
              experienceLevel: row.experienceLevel,
            }
          : null,
        mentorProfile: row.mentorProfileId
          ? {
              id: row.mentorProfileId,
              bio: row.mentorBio,
              headline: row.headline,
              verificationStatus: row.verificationStatus,
            }
          : null,
      },
    }), {
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
