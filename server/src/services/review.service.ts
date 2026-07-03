import Review from '../models/Review';
import ReviewHistory from '../models/ReviewHistory';
import Analytics from '../models/Analytics';
import AIService from './ai.service';
import AppError from '../utils/AppError';
import { escapeRegex, requireObjectId } from '../utils/security';

export class ReviewService {
  /**
   * Submits code to AI review engine, saves review details, updates history and updates analytics.
   */
  public static async createReview(
    userId: string,
    language: string,
    sourceCode: string
  ): Promise<any> {
    const ownerId = requireObjectId(userId, 'user ID');

    // 1. Trigger Gemini API Review
    const aiReview = await AIService.reviewCode(language, sourceCode);

    // 2. Save Review detail document
    const review = await Review.create({
      userId: ownerId,
      language,
      sourceCode,
      optimizedCode: aiReview.optimizedCode,
      aiSummary: aiReview.summary,
      score: aiReview.score,
      reviewTime: aiReview.reviewTime,
      bugs: aiReview.bugs,
      securityIssues: aiReview.securityIssues,
      performanceIssues: aiReview.performanceIssues,
      codeSmells: aiReview.codeSmells,
      bestPractices: aiReview.bestPractices,
      complexity: aiReview.complexity,
      documentation: aiReview.documentation,
      unitTests: aiReview.unitTests
    });

    // 3. Create Review History record
    const title = `${language} Code Review - ${new Date().toLocaleDateString()}`;
    await ReviewHistory.create({
      reviewId: review._id,
      userId: ownerId,
      title,
      language,
      isFavorite: false
    });

    // 4. Update Developer Analytics Profile (running asynchronously)
    this.updateUserAnalytics(userId, review, sourceCode).catch((err) => {
      console.error('Failed to update user analytics asynchronously:', err);
    });

    return {
      reviewId: review._id,
      score: review.score,
      summary: review.aiSummary,
      bugs: review.bugs,
      security: review.securityIssues,
      performance: review.performanceIssues,
      codeSmells: review.codeSmells,
      bestPractices: review.bestPractices,
      optimizedCode: review.optimizedCode,
      documentation: review.documentation,
      unitTests: review.unitTests
    };
  }

  /**
   * Fetches detailed review by ID. Checks ownership.
   */
  public static async getReview(reviewId: string, userId: string): Promise<any> {
    const reviewObjectId = requireObjectId(reviewId, 'review ID');
    const ownerId = requireObjectId(userId, 'user ID');
    const review = await Review.findOne({ _id: reviewObjectId, userId: ownerId });
    if (!review) {
      throw new AppError('Review not found.', 404, 'REVIEW_001');
    }

    // Track last viewed date in history
    await ReviewHistory.updateOne(
      { reviewId: review._id, userId: ownerId },
      { $set: { lastViewed: new Date() } }
    );

    return review;
  }

  /**
   * Soft deletes review from history.
   */
  public static async deleteReview(reviewId: string, userId: string): Promise<void> {
    const history = await ReviewHistory.findOne({
      reviewId: requireObjectId(reviewId, 'review ID'),
      userId: requireObjectId(userId, 'user ID')
    });
    if (!history) {
      throw new AppError('Review history not found.', 404, 'REVIEW_001');
    }

    history.deletedAt = new Date();
    await history.save();
  }

  /**
   * Toggles Favorite status on a review.
   */
  public static async toggleFavorite(reviewId: string, userId: string): Promise<any> {
    const history = await ReviewHistory.findOne({
      reviewId: requireObjectId(reviewId, 'review ID'),
      userId: requireObjectId(userId, 'user ID')
    });
    if (!history) {
      throw new AppError('Review history not found.', 404, 'REVIEW_001');
    }

    history.isFavorite = !history.isFavorite;
    await history.save();
    return { isFavorite: history.isFavorite };
  }

  /**
   * Updates review title.
   */
  public static async updateTitle(reviewId: string, userId: string, title: string): Promise<void> {
    const history = await ReviewHistory.findOne({
      reviewId: requireObjectId(reviewId, 'review ID'),
      userId: requireObjectId(userId, 'user ID')
    });
    if (!history) {
      throw new AppError('Review history not found.', 404, 'REVIEW_001');
    }

    history.title = title;
    await history.save();
  }

  /**
   * Lists historical reviews with pagination, sort options, searching and filters.
   */
  public static async listReviews(
    userId: string,
    filters: {
      page: number;
      limit: number;
      language?: string;
      sort: string;
      order: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<any> {
    const query: any = {
      userId: requireObjectId(userId, 'user ID'),
      deletedAt: null
    };

    if (filters.language) {
      query.language = filters.language;
    }

    if (filters.search) {
      query.title = { $regex: escapeRegex(filters.search), $options: 'i' };
    }

    const allowedSortFields = new Set(['createdAt', 'lastViewed', 'title', 'language']);
    const sortField = allowedSortFields.has(filters.sort) ? filters.sort : 'createdAt';
    const sortOption: any = {};
    sortOption[sortField] = filters.order === 'desc' ? -1 : 1;

    const skip = (filters.page - 1) * filters.limit;

    const [items, totalItems] = await Promise.all([
      ReviewHistory.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      ReviewHistory.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / filters.limit);

    return {
      page: filters.page,
      limit: filters.limit,
      totalItems,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrevious: filters.page > 1,
      items: items.map((item) => ({
        id: item.reviewId,
        title: item.title,
        language: item.language,
        isFavorite: item.isFavorite,
        lastViewed: item.lastViewed,
        createdAt: item.createdAt
      }))
    };
  }

  /**
   * Asynchronously updates the user's running aggregate analytics database records.
   */
  private static async updateUserAnalytics(
    userId: string,
    review: any,
    sourceCode: string
  ): Promise<void> {
    const ownerId = requireObjectId(userId, 'user ID');
    const lines = sourceCode.split('\n').length;
    const numBugs = review.bugs.length;
    const numSecurity = review.securityIssues.length;

    let analytics = await Analytics.findOne({ userId: ownerId });
    if (!analytics) {
      analytics = new Analytics({ userId: ownerId });
    }

    const currentTotal = analytics.totalReviews;
    const nextTotal = currentTotal + 1;

    // Calculate new running average score
    const newAverageScore = Math.round(
      (analytics.averageScore * currentTotal + review.score) / nextTotal
    );

    // Calculate new average response time
    const newAverageResponseTime = Math.round(
      (analytics.averageResponseTime * currentTotal + review.reviewTime) / nextTotal
    );

    // Update fields
    analytics.totalReviews = nextTotal;
    analytics.averageScore = newAverageScore;
    analytics.totalLinesReviewed += lines;
    analytics.bugsDetected += numBugs;
    analytics.securityIssues += numSecurity;
    analytics.averageResponseTime = newAverageResponseTime;
    analytics.lastUpdated = new Date();

    // Determine favorite language using aggregation
    const favLangResult = await ReviewHistory.aggregate([
      { $match: { userId: ownerId, deletedAt: null } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (favLangResult && favLangResult.length > 0) {
      analytics.favoriteLanguage = favLangResult[0]._id;
    }

    await analytics.save();
  }
}

export default ReviewService;
