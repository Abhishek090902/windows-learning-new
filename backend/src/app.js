import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import mentorRoutes from './modules/mentors/mentor.routes.js';
import sessionRoutes from './modules/sessions/session.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import requirementRoutes from './modules/requirements/requirement.routes.js';
import proposalRoutes from './modules/proposals/proposal.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import skillRoutes from './modules/skills/skill.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import mentorProfileRoutes from './routes/mentorProfileRoutes.js';
import reviewSystemRoutes from './routes/reviewRoutes.js';
import meetingRoutes from './routes/meetings.js';
import prisma from './config/db.js';
import config from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = (config.frontendUrl || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments when the production frontend URL is configured.
    if (origin.endsWith('.vercel.app') && allowedOrigins.some((entry) => entry.includes('.vercel.app'))) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({
  verify: (req, _res, buf) => {
    if (buf?.length) {
      req.rawBody = buf.toString('utf8');
    }
  },
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Versioning - v1
const API_V1 = '/api/v1';

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      ok: true,
      database: 'connected',
      env: {
        databaseUrl: Boolean(config.databaseUrl),
        databaseDirectUrl: Boolean(config.databaseDirectUrl),
        jwtSecret: Boolean(config.jwtSecret && config.jwtSecret !== 'your_default_secret'),
        supabaseUrl: Boolean(config.supabaseUrl),
        supabasePublishableKey: Boolean(config.supabasePublishableKey),
        supabaseServiceRoleKey: Boolean(config.supabaseServiceRoleKey),
        frontendUrl: config.frontendUrl || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      database: 'disconnected',
      error: error.message,
      env: {
        databaseUrl: Boolean(config.databaseUrl),
        databaseDirectUrl: Boolean(config.databaseDirectUrl),
        supabaseUrl: Boolean(config.supabaseUrl),
        supabasePublishableKey: Boolean(config.supabasePublishableKey),
        supabaseServiceRoleKey: Boolean(config.supabaseServiceRoleKey),
        frontendUrl: config.frontendUrl || null,
      },
    });
  }
});

app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/users`, userRoutes);
app.use(`${API_V1}/mentors`, mentorRoutes);
app.use(`${API_V1}/sessions`, sessionRoutes);
app.use(`${API_V1}/sessions`, meetingRoutes);
app.use(`${API_V1}/wallet`, walletRoutes);
app.use(`${API_V1}/requirements`, requirementRoutes);
app.use(`${API_V1}/proposals`, proposalRoutes);
app.use(`${API_V1}/reviews`, reviewRoutes);
app.use(`${API_V1}/analytics`, analyticsRoutes);
app.use(`${API_V1}/categories`, categoryRoutes);
app.use(`${API_V1}/skills`, skillRoutes);
app.use(`${API_V1}/chat`, chatRoutes);
app.use(`${API_V1}/ai`, aiRoutes);
app.use(`${API_V1}/mentor-profiles`, mentorProfileRoutes);
app.use(`${API_V1}/review-system`, reviewSystemRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
