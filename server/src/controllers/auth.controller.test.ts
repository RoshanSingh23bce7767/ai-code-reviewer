import { Response, NextFunction } from 'express';
import AuthController from './auth.controller';
import AuthService from '../services/auth.service';
import { AuthenticatedRequest } from '../types';

jest.mock('../services/auth.service');

describe('AuthController', () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user and returns 201', async () => {
    (AuthService.register as jest.Mock).mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      name: 'Jane',
      email: 'jane@example.com',
      role: 'user'
    });

    const req = { body: { name: 'Jane', email: 'jane@example.com', password: 'SecurePass123!' } } as any;
    const res = mockResponse();

    await AuthController.register(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ email: 'jane@example.com' }) })
    );
  });

  it('logs in a user and sets auth cookies', async () => {
    (AuthService.login as jest.Mock).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: '507f1f77bcf86cd799439011', email: 'jane@example.com' }
    });

    const req = {
      body: { email: 'jane@example.com', password: 'SecurePass123!' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' }
    } as any;
    const res = mockResponse();

    await AuthController.login(req, res, mockNext);

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('revokes sessions for authenticated users', async () => {
    (AuthService.revokeAllSessions as jest.Mock).mockResolvedValue(undefined);

    const req = {
      user: { userId: '507f1f77bcf86cd799439011', email: 'jane@example.com', role: 'user' }
    } as AuthenticatedRequest;
    const res = mockResponse();

    await AuthController.revokeSessions(req, res, mockNext);

    expect(AuthService.revokeAllSessions).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
