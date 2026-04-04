import { corsHeaders } from '../_shared/cors.ts';
import { ensureMethod, fail, HttpError, ok } from '../_shared/http.ts';
import { requireAuth } from '../_shared/auth.ts';
import { createSession, getUserSessions, updateSessionStatus } from '../_shared/sessions.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    ensureMethod(request, ['GET', 'POST', 'PATCH']);
    const auth = await requireAuth(request);
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const sessions = await getUserSessions(auth);
      return ok(sessions, 'Sessions retrieved successfully');
    }

    if (request.method === 'POST') {
      const payload = await request.json();
      const session = await createSession(auth, payload);
      return ok(session, 'Session request sent successfully', 201);
    }

    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      throw new HttpError(400, 'sessionId is required');
    }

    const payload = await request.json();
    const session = await updateSessionStatus(auth, sessionId, payload.status);
    return ok(session, 'Session status updated successfully');
  } catch (error) {
    return fail(error);
  }
});
