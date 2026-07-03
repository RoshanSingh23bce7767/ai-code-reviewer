import mongoose from 'mongoose';
import ReviewService from './review.service';
import Review from '../models/Review';
import ReviewHistory from '../models/ReviewHistory';
import AIService from './ai.service';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/helpers/testDb';

jest.mock('./ai.service', () => ({
  __esModule: true,
  default: {
    reviewCode: jest.fn().mockResolvedValue({
      optimizedCode: 'console.log("better")',
      summary: 'Looks good',
      score: 92,
      reviewTime: 1200,
      bugs: [],
      securityIssues: [],
      performanceIssues: [],
      codeSmells: [],
      bestPractices: [],
      complexity: { time: 'O(n)', space: 'O(1)' },
      documentation: 'Add docs',
      unitTests: 'describe(...)'
    })
  }
}));

describe('ReviewService', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('creates a review using the AI service', async () => {
    const result = await ReviewService.createReview(userId, 'JavaScript', 'console.log("hi")');

    expect(AIService.reviewCode).toHaveBeenCalledWith('JavaScript', 'console.log("hi")');
    expect(result.score).toBe(92);

    const savedReview = await Review.findOne({ userId });
    expect(savedReview).toBeTruthy();

    const history = await ReviewHistory.findOne({ userId });
    expect(history?.language).toBe('JavaScript');
  });
});
