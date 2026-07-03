import { Response, NextFunction } from 'express';
import UserService from '../services/user.service';
import { AuthenticatedRequest } from '../types';

export class UserController {
  public static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await UserService.getProfile(req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Profile fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await UserService.updateProfile(req.user!.userId, req.body.name, req.body.avatar);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserService.deleteAccount(req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await UserService.getNotifications(req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Notifications fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markNotificationRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserService.markNotificationRead(req.params.notificationId, req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserService.deleteNotification(req.params.notificationId, req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
