# Deployment Guide

## Recommended Setup

Deploy this project as two separate services:

1. `frontend` on Vercel
2. `backend` on a Node-friendly host such as Render, Railway, or another VPS/container host

This repository's backend uses Express, Prisma, and Socket.IO. The real-time Socket.IO layer is not a good fit for a pure Vercel serverless deployment.

## Backend Checklist

Create `backend/.env` from [backend/.env.example](/e:/WEB/Windows-Learning/backend/.env.example) and set real values for:

- `DATABASE_URL`
- `DATABASE_DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` if you need admin Supabase operations

Useful backend checks:

- Health endpoint: `GET /api/health`
- Local API base: `http://localhost:3000/api/v1`

After env setup, run:

```powershell
cd backend
npx prisma generate
npx prisma migrate deploy
npm start
```

For production, set `FRONTEND_URL` to a comma-separated list when needed, for example:

```env
FRONTEND_URL=https://your-app.vercel.app,https://your-custom-domain.com
```

If you use Vercel preview deployments and want Socket.IO/CORS to accept them, include at least one `.vercel.app` URL in `FRONTEND_URL`.

## Frontend Checklist

Create `frontend/.env.local` from [frontend/.env.local.example](/e:/WEB/Windows-Learning/frontend/.env.local.example).

For production, set:

```env
VITE_API_URL=https://your-backend-domain.com/api/v1
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Vercel Settings

When creating the Vercel project:

1. Set the root directory to `frontend`
2. Framework preset: `Vite`
3. Build command: `npm run build`
4. Output directory: `dist`

The SPA rewrite is already configured in [frontend/vercel.json](/e:/WEB/Windows-Learning/frontend/vercel.json).

## Railway Setup

For Railway, deploy only the backend service from this repository.

Railway docs I used:

- https://docs.railway.com/guides/express
- https://docs.railway.com/deployments/monorepo
- https://docs.railway.com/variables
- https://docs.railway.com/config-as-code

This repo now includes Railway config in [backend/railway.toml](/e:/WEB/Windows-Learning/backend/railway.toml).

### Railway backend steps

1. Create a new Railway project
2. Add a service from your GitHub repo
3. Set the service Root Directory to `/backend`
4. If Railway does not auto-detect the config file, set the config path to `/backend/railway.toml`
5. Generate a public domain in the service Networking tab
6. Add the required service variables in the Variables tab
7. Deploy the service

### Railway variables to add

If you keep using your current Neon + Supabase setup, add these values to the Railway backend service:

- `DATABASE_URL`
- `DATABASE_DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` if AI routes are enabled
- `DAILY_API_KEY`, `DAILY_DOMAIN`, `DAILY_API_URL` if meetings are enabled
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` if Stripe is enabled
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` if Razorpay is enabled

### Important values

- `FRONTEND_URL` should be your deployed frontend URL, for example `https://your-app.vercel.app`
- If you have multiple frontend domains, use a comma-separated list
- Keep `DATABASE_URL` and `DATABASE_DIRECT_URL` as your Neon connection strings unless you want to migrate databases

### Verify after deploy

- Open `https://your-railway-domain/api/health`
- Confirm it returns `ok: true`
- Set `VITE_API_URL=https://your-railway-domain/api/v1` in the frontend deployment
- Set `VITE_SOCKET_URL=https://your-railway-domain` in the frontend deployment

## Why Your Current Deploy Fails

- The frontend currently defaults to a local-only API URL during development
- The backend is a separate Node server, not a native Vercel backend
- Socket.IO needs a persistent server process
- Environment variables must be set separately for frontend and backend

## Security Note

Secrets should not stay in checked or shared env files. If any real database, JWT, OpenAI, Daily, or other secret values were exposed, rotate them before deploying.
