import { corsHeaders } from '../_shared/cors.ts';
import { json } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return json({
    success: false,
    error: 'Mentors module migration is not implemented yet.',
    statusCode: 501,
  }, 501);
});
