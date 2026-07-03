const layout = (title: string, body: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6fb; font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
    .header { background: #111827; color: #ffffff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 32px; line-height: 1.6; }
    .button { display: inline-block; margin: 24px 0; padding: 12px 20px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .token { display: inline-block; padding: 10px 14px; background: #f3f4f6; border-radius: 8px; font-family: Consolas, monospace; word-break: break-all; }
    .footer { padding: 20px 32px 28px; font-size: 12px; color: #6b7280; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>AI Code Review</h1></div>
    <div class="content">${body}</div>
    <div class="footer">This is an automated message from AI Code Review. If you did not request this email, you can safely ignore it.</div>
  </div>
</body>
</html>`;

export interface EmailTemplateVariables {
  name?: string;
  token?: string;
  actionUrl?: string;
  clientUrl?: string;
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const renderWelcomeEmail = ({ name = 'there', clientUrl = 'http://localhost:5173' }: EmailTemplateVariables): string =>
  layout(
    'Welcome to AI Code Review',
    `<p>Hi ${escapeHtml(name)},</p>
     <p>Welcome to AI Code Review. Your account has been created and is ready for verification.</p>
     <p>Visit your dashboard to start reviewing code with AI-powered insights.</p>
     <a class="button" href="${clientUrl}">Open Dashboard</a>`
  );

export const renderVerificationEmail = ({
  name = 'there',
  token = '',
  actionUrl = '',
  clientUrl = 'http://localhost:5173'
}: EmailTemplateVariables): string =>
  layout(
    'Verify your email',
    `<p>Hi ${escapeHtml(name)},</p>
     <p>Thanks for signing up. Please verify your email address to activate your account.</p>
     ${actionUrl ? `<a class="button" href="${actionUrl}">Verify Email</a>` : ''}
     <p>Or use this verification token:</p>
     <p><span class="token">${token}</span></p>
     <p>This token expires in 24 hours. You can also verify from ${clientUrl}.</p>`
  );

export const renderForgotPasswordEmail = ({
  name = 'there',
  token = '',
  actionUrl = ''
}: EmailTemplateVariables): string =>
  layout(
    'Reset your password',
    `<p>Hi ${escapeHtml(name)},</p>
     <p>We received a request to reset your password. If this was you, use the button below or the token provided.</p>
     ${actionUrl ? `<a class="button" href="${actionUrl}">Reset Password</a>` : ''}
     <p>Reset token:</p>
     <p><span class="token">${token}</span></p>
     <p>This token expires in 1 hour.</p>`
  );

export const renderPasswordChangedEmail = ({ name = 'there', clientUrl = 'http://localhost:5173' }: EmailTemplateVariables): string =>
  layout(
    'Password changed',
    `<p>Hi ${escapeHtml(name)},</p>
     <p>Your password was changed successfully. If you did not make this change, contact support immediately.</p>
     <a class="button" href="${clientUrl}/login">Sign In</a>`
  );
