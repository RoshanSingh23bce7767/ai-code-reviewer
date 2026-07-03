import { Response, NextFunction } from 'express';
import ReviewService from '../services/review.service';
import { AuthenticatedRequest } from '../types';

export class ReviewController {
  public static async create(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { language, sourceCode } = req.body;

      const data = await ReviewService.createReview(userId, language, sourceCode);

      res.status(201).json({
        success: true,
        message: 'Review generated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { reviewId } = req.params;

      const data = await ReviewService.getReview(reviewId, userId);

      res.status(200).json({
        success: true,
        message: 'Review details fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { reviewId } = req.params;

      await ReviewService.deleteReview(reviewId, userId);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleFavorite(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { reviewId } = req.params;

      const data = await ReviewService.toggleFavorite(reviewId, userId);

      res.status(200).json({
        success: true,
        message: 'Favorite status updated',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTitle(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { reviewId } = req.params;
      const { title } = req.body;

      await ReviewService.updateTitle(reviewId, userId, title);

      res.status(200).json({
        success: true,
        message: 'Review title updated successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listReviews(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      // Extract query parameters with defaults matching PRD
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const language = req.query.language as string | undefined;
      const sort = (req.query.sort as string) || 'createdAt';
      const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';
      const search = req.query.q as string | undefined; // q parameter for search

      const data = await ReviewService.listReviews(userId, {
        page,
        limit,
        language,
        sort,
        order,
        search
      });

      res.status(200).json({
        success: true,
        message: 'Reviews fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
