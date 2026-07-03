import User from '../models/User';
import Session from '../models/Session';
import Notification from '../models/Notification';
import AppError from '../utils/AppError';
import { requireObjectId } from '../utils/security';

export class UserService {
  /**
   * Fetch active profile details.
   */
  public static async getProfile(userId: string): Promise<any> {
    const user = await User.findById(requireObjectId(userId, 'user ID')).select('-password');
    if (!user) {
      throw new AppError('User profile not found.', 404, 'USER_001');
    }
    return user;
  }

  /**
   * Update profile fields (name and avatar).
   */
  public static async updateProfile(userId: string, name?: string, avatar?: string): Promise<any> {
    const user = await User.findById(requireObjectId(userId, 'user ID'));
    if (!user) {
      throw new AppError('User profile not found.', 404, 'USER_001');
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };
  }

  /**
   * Delete account (deletes session logs and soft deletes profile entry if needed, here hard-delete is fine).
   */
  public static async deleteAccount(userId: string): Promise<void> {
    const ownerId = requireObjectId(userId, 'user ID');
    const result = await User.deleteOne({ _id: ownerId });
    if (result.deletedCount === 0) {
      throw new AppError('User account not found.', 404, 'USER_001');
    }
    // Delete all session keys
    await Session.deleteMany({ userId: ownerId });
  }

  /**
   * List user notifications.
   */
  public static async getNotifications(userId: string): Promise<any[]> {
    return Notification.find({ userId: requireObjectId(userId, 'user ID') }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Marks a specific notification as read.
   */
  public static async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.updateOne(
      {
        _id: requireObjectId(notificationId, 'notification ID'),
        userId: requireObjectId(userId, 'user ID')
      },
      { $set: { read: true } }
    );
    if (result.matchedCount === 0) {
      throw new AppError('Notification not found.', 404, 'VALIDATION_001');
    }
  }

  /**
   * Deletes a notification alert.
   */
  public static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.deleteOne({
      _id: requireObjectId(notificationId, 'notification ID'),
      userId: requireObjectId(userId, 'user ID')
    });
    if (result.deletedCount === 0) {
      throw new AppError('Notification not found.', 404, 'VALIDATION_001');
    }
  }
}

export default UserService;
