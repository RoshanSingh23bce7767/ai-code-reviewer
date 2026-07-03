import Analytics from '../models/Analytics';
import ReviewHistory from '../models/ReviewHistory';
import { requireObjectId } from '../utils/security';

export class DashboardService {
  /**
   * Resolves overall dashboard statistics for a given user.
   */
  public static async getStats(userId: string): Promise<any> {
    const ownerId = requireObjectId(userId, 'user ID');
    let stats = await Analytics.findOne({ userId: ownerId });

    if (!stats) {
      stats = await Analytics.create({
        userId: ownerId
      });
    }

    // Fetch the 5 most recent reviews
    const recentReviews = await ReviewHistory.find({
      userId: ownerId,
      deletedAt: null
    })
      .sort({ lastViewed: -1 })
      .limit(5)
      .lean();

    return {
      totalReviews: stats.totalReviews,
      averageScore: stats.averageScore,
      favoriteLanguage: stats.favoriteLanguage,
      bugsDetected: stats.bugsDetected,
      securityIssues: stats.securityIssues,
      totalLinesReviewed: stats.totalLinesReviewed,
      averageResponseTime: stats.averageResponseTime,
      recentReviews: recentReviews.map((item) => ({
        id: item.reviewId,
        title: item.title,
        language: item.language,
        lastViewed: item.lastViewed
      }))
    };
  }

  /**
   * Group and aggregate review counts by programming language.
   */
  public static async getLanguageDistribution(userId: string): Promise<any[]> {
    const ownerId = requireObjectId(userId, 'user ID');
    const result = await ReviewHistory.aggregate([
      { $match: { userId: ownerId, deletedAt: null } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
      { $sort: { value: -1 } }
    ]);
    return result;
  }

  /**
   * Group review counts by month for historical coding volume chart.
   */
  public static async getMonthlyStats(userId: string): Promise<any[]> {
    const ownerId = requireObjectId(userId, 'user ID');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await ReviewHistory.aggregate([
      {
        $match: {
          userId: ownerId,
          deletedAt: null,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    return result.map((item) => {
      const monthIndex = item._id.month - 1;
      return {
        month: monthNames[monthIndex],
        count: item.count
      };
    });
  }
}

export default DashboardService;
