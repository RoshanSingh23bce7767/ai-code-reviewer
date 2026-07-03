import { Response, NextFunction } from 'express';
import DashboardController from './dashboard.controller';
import DashboardService from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types';

jest.mock('../services/dashboard.service');

describe('DashboardController', () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns dashboard stats', async () => {
    (DashboardService.getStats as jest.Mock).mockResolvedValue({ totalReviews: 3, averageScore: 88 });

    const req = {
      user: { userId: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'user' }
    } as AuthenticatedRequest;
    const res = mockResponse();

    await DashboardController.getStats(req, res, mockNext);

    expect(DashboardService.getStats).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns language distribution', async () => {
    (DashboardService.getLanguageDistribution as jest.Mock).mockResolvedValue([
      { name: 'JavaScript', value: 2 }
    ]);

    const req = {
      user: { userId: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'user' }
    } as AuthenticatedRequest;
    const res = mockResponse();

    await DashboardController.getLanguageDistribution(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [{ name: 'JavaScript', value: 2 }] })
    );
  });
});
