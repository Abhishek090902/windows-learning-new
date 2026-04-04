# Supabase Edge Migration

This directory holds the gradual migration from the Express compatibility backend to Supabase Edge Functions.

## Structure

- `_shared`
  - `auth.ts`: verifies Supabase JWTs and resolves the local Neon-backed app user
  - `cors.ts`: shared CORS headers
  - `neon.ts`: Neon serverless connection helper
  - `http.ts`: consistent JSON responses and typed HTTP errors
  - `ids.ts`: ID helpers
  - `sessions.ts`: reusable session business logic for Edge handlers
- `sessions`
  - `index.ts`: `GET`, `POST`, and `PATCH` session endpoints
- `chat`
  - `index.ts`: migration placeholder
- `wallet`
  - `index.ts`: migration placeholder
- `mentors`
  - `index.ts`: migration placeholder
- `auth-sync`
  - `index.ts`: syncs a Supabase-authenticated user into Neon
- `me`
  - `index.ts`: returns the current Neon-backed profile for the authenticated user

## Rollout

- Keep existing Express routes live during migration.
- Enable Edge-backed sessions in the frontend by setting `VITE_USE_SUPABASE_EDGE_SESSIONS=true`.
- Leave the flag `false` to continue using Express for sessions while the rest of the app remains unchanged.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL` or `NEON_DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
  - optional for the `sessions` module
  - required for admin-style function work beyond JWT verification
