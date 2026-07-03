import { Schema, model } from 'mongoose';
import { IReview } from '../types';

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    language: {
      type: String,
      required: true,
      index: true
    },
    sourceCode: {
      type: String,
      required: true
    },
    optimizedCode: {
      type: String,
      default: ''
    },
    aiSummary: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true
    },
    reviewTime: {
      type: Number,
      required: true
    },
    bugs: [
      {
        title: { type: String, required: true },
        line: { type: Number, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
        description: { type: String, required: true },
        recommendation: { type: String, required: true }
      }
    ],
    securityIssues: [
      {
        title: { type: String, required: true },
        cve: { type: String, default: '' },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
        description: { type: String, required: true },
        recommendation: { type: String, required: true }
      }
    ],
    performanceIssues: [
      {
        title: { type: String, required: true },
        impact: { type: String, required: true },
        description: { type: String, required: true },
        recommendation: { type: String, required: true }
      }
    ],
    codeSmells: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        recommendation: { type: String, required: true }
      }
    ],
    bestPractices: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        recommendation: { type: String, required: true }
      }
    ],
    complexity: {
      time: { type: String, default: 'N/A' },
      space: { type: String, default: 'N/A' }
    },
    documentation: {
      type: String,
      default: ''
    },
    unitTests: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for review listings performance
reviewSchema.index({ userId: 1, createdAt: -1 });

export const Review = model<IReview>('Review', reviewSchema);
export default Review;
