import { Response, NextFunction } from 'express';
import ReviewController from './review.controller';
import ReviewService from '../services/review.service';
import { AuthenticatedRequest } from '../types';

jest.mock('../services/review.service');

describe('ReviewController', () => {
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

  it('creates a review', async () => {
    (ReviewService.createReview as jest.Mock).mockResolvedValue({ reviewId: '507f1f77bcf86cd799439011', score: 90 });

    const req = {
      user: { userId: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'user' },
      body: { language: 'JavaScript', sourceCode: 'console.log("hi")' }
    } as AuthenticatedRequest;
    const res = mockResponse();

    await ReviewController.create(req, res, mockNext);

    expect(ReviewService.createReview).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'JavaScript',
      'console.log("hi")'
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updates a review title', async () => {
    (ReviewService.updateTitle as jest.Mock).mockResolvedValue(undefined);

    const req = {
      user: { userId: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'user' },
      params: { reviewId: '507f1f77bcf86cd799439011' },
      body: { title: 'Better title' }
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await ReviewController.updateTitle(req, res, mockNext);

    expect(ReviewService.updateTitle).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439011',
      'Better title'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
