import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBug {
  title: string;
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface ISecurityIssue {
  title: string;
  cve?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface IPerformanceIssue {
  title: string;
  impact: string;
  description: string;
  recommendation: string;
}

export interface ICodeSmell {
  title: string;
  description: string;
  recommendation: string;
}

export interface IBestPractice {
  title: string;
  description: string;
  recommendation: string;
}

export interface IComplexity {
  time: string;
  space: string;
}

export interface IReview extends Document {
  userId: Types.ObjectId;
  language: string;
  sourceCode: string;
  optimizedCode: string;
  aiSummary: string;
  score: number;
  reviewTime: number;
  bugs: IBug[];
  securityIssues: ISecurityIssue[];
  performanceIssues: IPerformanceIssue[];
  codeSmells: ICodeSmell[];
  bestPractices: IBestPractice[];
  complexity: IComplexity;
  documentation: string;
  unitTests: string;
  createdAt: Date;
}

export interface IReviewHistory extends Document {
  reviewId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  language: string;
  isFavorite: boolean;
  lastViewed: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession extends Document {
  userId: Types.ObjectId;
  refreshToken: string;
  ipAddress: string;
  device: string;
  browser: string;
  expiresAt: Date;
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: Date;
}

export interface IPrompt extends Document {
  name: string;
  version: string;
  prompt: string;
  active: boolean;
  createdAt: Date;
}

export interface IAnalytics extends Document {
  userId: Types.ObjectId;
  totalReviews: number;
  averageScore: number;
  favoriteLanguage: string;
  totalLinesReviewed: number;
  bugsDetected: number;
  securityIssues: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

