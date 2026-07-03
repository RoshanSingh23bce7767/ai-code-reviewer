import mongoose from 'mongoose';
import DashboardService from './dashboard.service';
import Analytics from '../models/Analytics';
import ReviewHistory from '../models/ReviewHistory';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/helpers/testDb';

describe('DashboardService', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('returns stats and recent reviews for a user', async () => {
    await Analytics.create({
      userId,
      totalReviews: 2,
      averageScore: 85,
      favoriteLanguage: 'JavaScript',
      bugsDetected: 1,
      securityIssues: 0,
      totalLinesReviewed: 40,
      averageResponseTime: 1200
    });

    const reviewId = new mongoose.Types.ObjectId();
    await ReviewHistory.create({
      reviewId,
      userId,
      title: 'Sample Review',
      language: 'JavaScript'
    });

    const stats = await DashboardService.getStats(userId);

    expect(stats.totalReviews).toBe(2);
    expect(stats.recentReviews).toHaveLength(1);
    expect(stats.recentReviews[0].title).toBe('Sample Review');
  });

  it('aggregates language distribution', async () => {
    const reviewId = new mongoose.Types.ObjectId();
    await ReviewHistory.create({
      reviewId,
      userId,
      title: 'JS Review',
      language: 'JavaScript'
    });

    const distribution = await DashboardService.getLanguageDistribution(userId);

    expect(distribution).toEqual([{ name: 'JavaScript', value: 1 }]);
  });
});
