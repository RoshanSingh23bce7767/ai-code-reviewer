import mongoose from 'mongoose';
import AuthService from './auth.service';
import User from '../models/User';
import Session from '../models/Session';
import Notification from '../models/Notification';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/helpers/testDb';
import { hashToken } from '../utils/security';

jest.mock('../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

jest.mock('./email.service', () => ({
  __esModule: true,
  default: { sendMail: jest.fn().mockResolvedValue(undefined) }
}));

describe('AuthService', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('rejects login for a non-verified user', async () => {
    await User.create({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'password123',
      isVerified: false
    });

    await expect(AuthService.login('jane@example.com', 'password123')).rejects.toMatchObject({
      errorCode: 'AUTH_005'
    });
  });

  it('rotates refresh tokens on refresh', async () => {
    const user = await User.create({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true
    });

    const initialTokens = await AuthService.login('john@example.com', 'password123');
    const refreshed = await AuthService.refresh(initialTokens.refreshToken);

    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.refreshToken).not.toEqual(initialTokens.refreshToken);

    const sessions = await Session.find({ userId: user._id });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].refreshToken).toBeDefined();
  });

  it('verifies email tokens stored in hidden user fields', async () => {
    const verificationToken = 'a'.repeat(64);
    const user = await User.create({
      name: 'Verified Soon',
      email: 'verify@example.com',
      password: 'password123',
      verificationToken: hashToken(verificationToken),
      verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      isVerified: false
    });

    await AuthService.verifyEmail(verificationToken);

    const verifiedUser = await User.findById(user._id).select('+verificationToken');
    expect(verifiedUser?.isVerified).toBe(true);
    expect(verifiedUser?.verificationToken).toBeFalsy();
    expect(verifiedUser?.verificationTokenExpires).toBeFalsy();
  });

  it('resets passwords using hidden reset token fields and normalized email', async () => {
    const user = await User.create({
      name: 'Reset Me',
      email: 'reset@example.com',
      password: 'OldPassword123!',
      isVerified: true
    });

    await AuthService.requestPasswordReset('RESET@example.com');

    const resetUser = await User.findById(user._id).select('+passwordResetToken');
    expect(resetUser?.passwordResetToken).toBeDefined();

    const resetToken = 'b'.repeat(64);
    resetUser!.passwordResetToken = hashToken(resetToken);
    resetUser!.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await resetUser!.save();

    await AuthService.resetPassword(resetToken, 'NewPassword123!');

    const loginData = await AuthService.login('reset@example.com', 'NewPassword123!');
    expect(loginData.accessToken).toBeDefined();
  });
});
