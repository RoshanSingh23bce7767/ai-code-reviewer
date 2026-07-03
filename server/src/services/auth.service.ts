import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Session from '../models/Session';
import Analytics from '../models/Analytics';
import Notification from '../models/Notification';
import AppError from '../utils/AppError';
import { TokenPayload } from '../types';
import { getJwtSecret, getClientUrl, isProduction } from '../config/env';
import emailService from './email.service';
import logger from '../config/logger';
import { hashToken } from '../utils/security';
import {
  renderForgotPasswordEmail,
  renderPasswordChangedEmail,
  renderVerificationEmail,
  renderWelcomeEmail
} from '../templates/email';

const JWT_SECRET = getJwtSecret();

export class AuthService {
  /**
   * Register a new user and initialize empty statistics dashboard.
   * In development mode, users are auto-verified since no SMTP server is available.
   * In production, a verification email is sent and users must verify before logging in.
   */
  public static async register(name: string, email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('Email already registered.', 400, 'AUTH_004');
    }

    // Keep registration usable when SMTP is not configured. Production
    // deployments can enable verification by setting complete SMTP credentials.
    const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const shouldSendVerificationEmail = process.env.NODE_ENV === 'test' || hasSmtpConfig;
    const autoVerify = !shouldSendVerificationEmail;

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = hashToken(verificationToken);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      verificationToken: autoVerify ? undefined : verificationTokenHash,
      verificationTokenExpires: autoVerify ? undefined : verificationTokenExpires,
      isVerified: autoVerify
    });

    // Initialize blank user analytics profile
    await Analytics.create({
      userId: user._id,
      totalReviews: 0,
      averageScore: 0,
      favoriteLanguage: 'N/A',
      totalLinesReviewed: 0,
      bugsDetected: 0,
      securityIssues: 0,
      averageResponseTime: 0
    });

    if (shouldSendVerificationEmail) {
      await emailService.sendMail({
        to: user.email,
        subject: 'Welcome to AI Code Review',
        html: renderWelcomeEmail({ name: user.name, clientUrl: getClientUrl() })
      });

      await emailService.sendMail({
        to: user.email,
        subject: 'Verify your email address',
        html: renderVerificationEmail({
          name: user.name,
          token: verificationToken,
          actionUrl: `${getClientUrl()}/verify-email?token=${verificationToken}`,
          clientUrl: getClientUrl()
        })
      });

      logger.info('User registered; verification email queued', { email: user.email });
    } else {
      // Development or no SMTP: auto-verified, skip email sending
      logger.info('User registered and auto-verified (no SMTP host or development mode)', { email: user.email });
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };
  }

  /**
   * Log in user, verify credentials, generate JWT and Refresh tokens, store session.
   */
  public static async login(
    email: string,
    password: string,
    ipAddress?: string,
    device?: string,
    browser?: string
  ): Promise<any> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'AUTH_001');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError('Account temporarily locked. Please try again later.', 403, 'AUTH_010');
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email before logging in.', 403, 'AUTH_005');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        await Notification.create({
          userId: user._id,
          title: 'Account locked',
          message: 'Too many failed login attempts. Your account is temporarily locked.',
          type: 'warning'
        });
        logger.warn('Account locked due to repeated failed login attempts', { email: user.email });
      } else {
        await user.save();
      }
      throw new AppError('Invalid email or password.', 401, 'AUTH_001');
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    logger.info('User authenticated successfully', { email: user.email });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);

    // Create session entry in database (valid for 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      userId: user._id,
      refreshToken: refreshTokenHash,
      ipAddress: ipAddress || 'Unknown',
      device: device || 'Unknown',
      browser: browser || 'Unknown',
      expiresAt
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    };
  }

  /**
   * Verify refresh token, perform rotation, generate new tokens, replace session.
   */
  public static async refresh(token: string, ipAddress?: string): Promise<any> {
    if (!token) {
      throw new AppError('Unauthorized: Refresh token is missing.', 401, 'AUTH_002');
    }

    const session = await this.findSessionByRefreshToken(token);
    if (!session || session.expiresAt < new Date()) {
      if (session) await Session.deleteOne({ _id: session._id }); // cleanup expired session
      throw new AppError('Unauthorized: Session expired or invalid refresh token.', 401, 'AUTH_003');
    }

    const user = await User.findById(session.userId);
    if (!user) {
      throw new AppError('Unauthorized: User not found.', 401, 'USER_001');
    }

    // Rotate tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();
    const newRefreshTokenHash = await this.hashRefreshToken(newRefreshToken);

    // Update session with rotated refresh token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    session.refreshToken = newRefreshTokenHash;
    session.expiresAt = newExpiresAt;
    if (ipAddress) session.ipAddress = ipAddress;
    await session.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Delete session and revoke access.
   */
  public static async logout(token: string): Promise<void> {
    const session = await this.findSessionByRefreshToken(token);
    if (session) {
      await Session.deleteOne({ _id: session._id });
    }
  }

  public static async revokeAllSessions(userId: string): Promise<void> {
    await Session.deleteMany({ userId });
  }

  private static async findSessionByRefreshToken(token: string): Promise<any | null> {
    if (!token) {
      return null;
    }

    const sessions = await Session.find({ expiresAt: { $gte: new Date() } });

    for (const session of sessions) {
      if (session.refreshToken && (await bcrypt.compare(token, session.refreshToken))) {
        return session;
      }
    }

    return null;
  }

  private static async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  public static async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ verificationToken: hashToken(token) })
      .select('+verificationToken +passwordResetToken');
    if (!user) {
      throw new AppError('Invalid or expired verification token.', 400, 'AUTH_006');
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();
      throw new AppError('Verification token has expired.', 400, 'AUTH_007');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
  }

  public static async requestPasswordReset(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken');
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await emailService.sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: renderForgotPasswordEmail({
        name: user.name,
        token: resetToken,
        actionUrl: `${getClientUrl()}/reset-password?token=${resetToken}`
      })
    });

    logger.info('Password reset email queued', { email: user.email });
  }

  public static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ passwordResetToken: hashToken(token) })
      .select('+password +passwordResetToken');
    if (!user) {
      throw new AppError('Invalid or expired reset token.', 400, 'AUTH_008');
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('Password reset token has expired.', 400, 'AUTH_009');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await emailService.sendMail({
      to: user.email,
      subject: 'Your password was changed',
      html: renderPasswordChangedEmail({ name: user.name, clientUrl: getClientUrl() })
    });
  }

  private static generateAccessToken(user: any): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '15m',
      algorithm: 'HS256',
      issuer: 'ai-code-review-platform'
    });
  }

  private static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }
}

export default AuthService;
