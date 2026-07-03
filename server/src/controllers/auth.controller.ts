import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import logger from '../config/logger';
import { getCookieClearOptions, getCookieOptions } from '../config/env';
import AppError from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

const getRefreshToken = (req: Request): string | undefined => {
  return req.body?.refreshToken || req.cookies?.refreshToken;
};

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const data = await AuthService.register(name, email, password);

      logger.info('User registered', { email });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const device = req.headers['user-agent'] || 'Unknown';

      const data = await AuthService.login(email, password, ipAddress, device);

      res.cookie('accessToken', data.accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', data.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logger.info('User logged in', { email });

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: { user: data.user }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = getRefreshToken(req);
      if (!refreshToken) {
        throw new AppError('Unauthorized: Refresh token is missing.', 401, 'AUTH_002');
      }

      const data = await AuthService.refresh(refreshToken, req.ip);

      res.cookie('accessToken', data.accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', data.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logger.info('Token refreshed', { ip: req.ip });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = getRefreshToken(req);
      if (!refreshToken) {
        throw new AppError('Unauthorized: Refresh token is missing.', 401, 'AUTH_002');
      }

      await AuthService.logout(refreshToken);

      res.clearCookie('accessToken', getCookieClearOptions());
      res.clearCookie('refreshToken', getCookieClearOptions());
      logger.info('User logged out', { ip: req.ip });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.verifyEmail(req.body.token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.requestPasswordReset(req.body.email);

      res.status(200).json({
        success: true,
        message: 'If the account exists, password reset instructions have been sent',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body.token, req.body.password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async revokeSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AuthService.revokeAllSessions(req.user!.userId);

      res.clearCookie('accessToken', getCookieClearOptions());
      res.clearCookie('refreshToken', getCookieClearOptions());

      res.status(200).json({
        success: true,
        message: 'All sessions revoked successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
