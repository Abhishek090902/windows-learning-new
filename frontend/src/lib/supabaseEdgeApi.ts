import { supabase } from '@/lib/supabase';

const edgeBaseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('No active Supabase session found.');
  }

  return token;
};

export const edgeFetch = async (path: string, init: RequestInit = {}) => {
  if (!edgeBaseUrl) {
    throw new Error('VITE_SUPABASE_FUNCTIONS_URL is not configured.');
  }

  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${edgeBaseUrl}/${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Edge request failed');
  }

  return payload;
};

export const createSessionViaEdge = async (input: {
  mentorId: string;
  startTime: string;
  endTime: string;
  topic?: string;
}) =>
  edgeFetch('sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getMySessionsViaEdge = async () =>
  edgeFetch('sessions', {
    method: 'GET',
  });

export const updateSessionStatusViaEdge = async (input: {
  sessionId: string;
  status: string;
}) =>
  edgeFetch(`sessions?sessionId=${encodeURIComponent(input.sessionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: input.status }),
  });
