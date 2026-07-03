import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema
} from './auth.validator';
import { createReviewSchema, updateReviewTitleSchema } from './review.validator';
import { updateProfileSchema } from './user.validator';

describe('request validation schemas', () => {
  it('validates register email and password rules', () => {
    const valid = registerSchema.safeParse({
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePass123!'
      }
    });

    const invalidEmail = registerSchema.safeParse({
      body: {
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'SecurePass123!'
      }
    });

    expect(valid.success).toBe(true);
    expect(invalidEmail.success).toBe(false);
  });

  it('validates login email and password', () => {
    const valid = loginSchema.safeParse({
      body: {
        email: 'user@example.com',
        password: 'any-password'
      }
    });

    const invalid = loginSchema.safeParse({
      body: {
        email: 'bad-email',
        password: ''
      }
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('validates forgot-password email', () => {
    const valid = forgotPasswordSchema.safeParse({
      body: { email: 'user@example.com' }
    });

    const invalid = forgotPasswordSchema.safeParse({
      body: { email: 'invalid' }
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('validates review source code payload', () => {
    const validLanguages = ['JavaScript', 'Ruby', 'C#', 'Shell'];

    const valid = validLanguages.every((language) => createReviewSchema.safeParse({
      body: {
        language,
        sourceCode: 'console.log("hello");'
      }
    }).success);

    const invalid = createReviewSchema.safeParse({
      body: {
        language: 'Elixir',
        sourceCode: ''
      }
    });

    expect(valid).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('validates review title updates', () => {
    const valid = updateReviewTitleSchema.safeParse({
      params: { reviewId: '507f1f77bcf86cd799439011' },
      body: { title: 'Refactored auth flow' }
    });

    const invalid = updateReviewTitleSchema.safeParse({
      params: { reviewId: '507f1f77bcf86cd799439011' },
      body: { title: '' }
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('validates profile updates', () => {
    const valid = updateProfileSchema.safeParse({
      body: { name: 'Updated Name' }
    });

    const invalid = updateProfileSchema.safeParse({
      body: {}
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
