import { Schema, model } from 'mongoose';
import { IPrompt } from '../types';

const promptSchema = new Schema<IPrompt>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    version: {
      type: String,
      required: true,
      default: '1.0.0'
    },
    prompt: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Prompt = model<IPrompt>('Prompt', promptSchema);
export default Prompt;
