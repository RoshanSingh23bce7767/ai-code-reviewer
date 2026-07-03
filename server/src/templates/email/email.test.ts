import {
  renderForgotPasswordEmail,
  renderPasswordChangedEmail,
  renderVerificationEmail,
  renderWelcomeEmail
} from './index';

describe('email templates', () => {
  it('renders welcome, verification, forgot password, and password changed templates', () => {
    expect(renderWelcomeEmail({ name: 'Alex' })).toContain('Welcome to AI Code Review');
    expect(renderVerificationEmail({ name: 'Alex', token: 'abc123' })).toContain('abc123');
    expect(renderForgotPasswordEmail({ name: 'Alex', token: 'reset123' })).toContain('reset123');
    expect(renderPasswordChangedEmail({ name: 'Alex' })).toContain('Password changed');
  });
});
