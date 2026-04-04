import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/responseHandler.js';
import { getSupabaseIdentity } from './supabase-auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    const { password, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'User registered successfully', 201);
  } catch (error) {
    if (error.code === 'P2002') {
      error.statusCode = 400;
      error.message = 'Email already exists';
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);
    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { accessToken, role } = req.body;
    const { user, token } = await authService.googleLoginUser(accessToken, role);
    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'Google login successful');
  } catch (error) {
    error.statusCode = 401;
    error.message = 'Google login failed';
    next(error);
  }
};

export const syncSupabaseSession = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token = bearer?.startsWith('Bearer ') ? bearer.split(' ')[1] : null;

    if (!token) {
      const error = new Error('Supabase session token is required');
      error.statusCode = 401;
      throw error;
    }

    const identity = await getSupabaseIdentity(token);
    if (!identity) {
      const error = new Error('Invalid Supabase session');
      error.statusCode = 401;
      throw error;
    }

    const { user } = await authService.syncSupabaseAuthUser(identity);
    const { password, ...userWithoutPassword } = user;

    return sendSuccess(res, { user: userWithoutPassword, token }, 'Supabase user synced successfully');
  } catch (error) {
    next(error);
  }
};
