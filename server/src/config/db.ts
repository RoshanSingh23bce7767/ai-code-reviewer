import mongoose from 'mongoose';
import logger from './logger';
import { isProduction } from './env';
import { User } from '../models/User';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_code_review';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: !isProduction
    });
    logger.info('Successfully connected to MongoDB.');

    // Auto-verify existing unverified users if we are in development or have no SMTP
    if (!isProduction || !process.env.SMTP_HOST) {
      try {
        const result = await User.updateMany(
          { isVerified: false },
          { $set: { isVerified: true, verificationToken: undefined, verificationTokenExpires: undefined } }
        );
        if (result.modifiedCount > 0) {
          logger.info(`Auto-verified ${result.modifiedCount} existing unverified user accounts.`);
        }
      } catch (err) {
        logger.error('Error during auto-verification of existing users:', err);
      }
    }
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
