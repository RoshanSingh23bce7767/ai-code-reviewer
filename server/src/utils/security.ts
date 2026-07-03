import crypto from 'crypto';
import { Types } from 'mongoose';
import AppError from './AppError';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const isObjectId = (value: string): boolean => {
  return objectIdPattern.test(value) && Types.ObjectId.isValid(value);
};

export const requireObjectId = (value: string, fieldName = 'id'): Types.ObjectId => {
  if (!isObjectId(value)) {
    throw new AppError(`Invalid ${fieldName}.`, 400, 'VALIDATION_001');
  }

  return new Types.ObjectId(value);
};

export const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
