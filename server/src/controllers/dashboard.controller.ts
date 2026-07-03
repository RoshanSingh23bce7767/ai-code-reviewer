import { Response, NextFunction } from 'express';
import DashboardService from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types';

export class DashboardController {
  public static async getStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await DashboardService.getStats(userId);

      res.status(200).json({
        success: true,
        message: 'Dashboard statistics fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getLanguageDistribution(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await DashboardService.getLanguageDistribution(userId);

      res.status(200).json({
        success: true,
        message: 'Language analytics distribution fetched',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMonthlyStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await DashboardService.getMonthlyStats(userId);

      res.status(200).json({
        success: true,
        message: 'Monthly statistics trends fetched',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
