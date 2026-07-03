import { Schema, model } from 'mongoose';
import { IAnalytics } from '../types';

const analyticsSchema = new Schema<IAnalytics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    favoriteLanguage: {
      type: String,
      default: 'N/A'
    },
    totalLinesReviewed: {
      type: Number,
      default: 0
    },
    bugsDetected: {
      type: Number,
      default: 0
    },
    securityIssues: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const Analytics = model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
