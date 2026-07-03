import { Schema, model } from 'mongoose';
import { IReviewHistory } from '../types';

const reviewHistorySchema = new Schema<IReviewHistory>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      required: true
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    lastViewed: {
      type: Date,
      default: Date.now,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

reviewHistorySchema.index({ userId: 1, lastViewed: -1 });
reviewHistorySchema.index({ userId: 1, deletedAt: 1, createdAt: -1 });
reviewHistorySchema.index({ userId: 1, deletedAt: 1, language: 1 });

export const ReviewHistory = model<IReviewHistory>('ReviewHistory', reviewHistorySchema);
export default ReviewHistory;
