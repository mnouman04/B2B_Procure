import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const withSession = (res, session, message, status = 200) => {
  res.cookie('refreshToken', session.refreshToken, cookieOptions);
  res.cookie('accessToken', session.accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
  return status === 201 ? created(res, session, message) : ok(res, session, message);
};

export const registerCompany = asyncHandler(async (req, res) => {
  const session = await authService.registerCompany(req.body);
  return withSession(res, session, 'Company registered successfully', 201);
});

export const registerSupplier = asyncHandler(async (req, res) => {
  const session = await authService.registerSupplier(req.body);
  return withSession(res, session, 'Supplier account created — upload your documents to get verified', 201);
});

export const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body);
  return withSession(res, session, 'Signed in');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken;
  const session = await authService.refresh(token);
  return withSession(res, session, 'Session refreshed');
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('accessToken', cookieOptions);
  return ok(res, null, 'Signed out');
});

export const me = asyncHandler(async (req, res) => ok(res, await authService.me(req.user._id)));

export const updateProfile = asyncHandler(async (req, res) =>
  ok(res, await authService.updateProfile(req.user._id, req.body), 'Profile updated'));

export const changePassword = asyncHandler(async (req, res) =>
  ok(res, await authService.changePassword(req.user._id, req.body), 'Password changed'));
