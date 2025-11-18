import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('⚠️ RESEND_API_KEY is not set. Email functionality will not work.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'MikeAI <noreply@mikeai.co>';

export interface WelcomeEmailParams {
  to: string;
  firstName: string;
}

export interface OrgInvitationEmailParams {
  to: string;
  firstName: string;
  organizationName: string;
  role: 'coach' | 'client';
  loginEmail: string;
  commonPassword: string;
}

export interface PasswordResetEmailParams {
  to: string;
  firstName: string;
  resetLink: string;
}

export interface CommonPasswordChangedEmailParams {
  to: string;
  firstName: string;
  organizationName: string;
  newPassword: string;
}

export async function sendWelcomeEmail({ to, firstName }: WelcomeEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to MikeAI - Your Fitness Journey Starts Here!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .features { margin: 30px 0; }
            .feature { margin: 15px 0; padding-left: 30px; position: relative; }
            .feature:before { content: "✓"; position: absolute; left: 0; color: #f97316; font-weight: bold; font-size: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍎 Welcome to MikeAI!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>We're thrilled to have you join the MikeAI community! Your personalized health and wellness journey begins now.</p>
              
              <div class="features">
                <div class="feature">AI-powered meal planning tailored to your goals</div>
                <div class="feature">Custom workout plans designed for your fitness level</div>
                <div class="feature">Progress tracking and habit building tools</div>
                <div class="feature">Community support and challenges</div>
              </div>

              <center>
                <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}" class="button">Get Started Now</a>
              </center>

              <p>Ready to transform your lifestyle? Log in to your dashboard and explore all the features MikeAI has to offer!</p>
              
              <p style="margin-top: 30px;">
                <strong>Need help getting started?</strong><br>
                Check out our guides or reach out to our support team anytime.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MikeAI. All rights reserved.</p>
              <p>You're receiving this email because you signed up for MikeAI.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending welcome email to', to, ':', error);
      return { success: false, error };
    }

    console.log('✅ Welcome email sent successfully to', to, '- Message ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending welcome email to', to, ':', error);
    return { success: false, error };
  }
}

export async function sendOrgInvitationEmail({
  to,
  firstName,
  organizationName,
  role,
  loginEmail,
  commonPassword,
}: OrgInvitationEmailParams) {
  const roleDisplay = role === 'coach' ? 'Coach' : 'Client';
  const loginUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000';

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You've been invited to ${organizationName} on MikeAI`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
            .credentials { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f97316; }
            .credential-row { margin: 10px 0; }
            .credential-label { font-weight: 600; color: #4b5563; }
            .credential-value { font-family: monospace; background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 You're Invited!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>Great news! You've been added as a <strong>${roleDisplay}</strong> to <strong>${organizationName}</strong> on MikeAI.</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0;">Your Login Credentials</h3>
                <div class="credential-row">
                  <div class="credential-label">Login Email:</div>
                  <div class="credential-value">${loginEmail}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Organization Password:</div>
                  <div class="credential-value">${commonPassword}</div>
                </div>
              </div>

              <div class="warning">
                <strong>🔒 Security Tip:</strong> After your first login, you can set your own personal password in Settings. You can use either your personal password or the organization password to log in.
              </div>

              <center>
                <a href="${loginUrl}" class="button">Login to MikeAI</a>
              </center>

              <p style="margin-top: 30px;">
                <strong>What's next?</strong><br>
                ${role === 'coach' 
                  ? 'As a coach, you can create meal and workout plans, manage clients, and track their progress.' 
                  : 'As a client, you\'ll have access to personalized meal and workout plans created by your coach.'}
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MikeAI. All rights reserved.</p>
              <p>You're receiving this email because you were added to an organization on MikeAI.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending invitation email to', to, ':', error);
      return { success: false, error };
    }

    console.log('✅ Invitation email sent successfully to', to, '- Message ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending invitation email to', to, ':', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail({
  to,
  firstName,
  resetLink,
}: PasswordResetEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your MikeAI Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>We received a request to reset your MikeAI password. Click the button below to create a new password.</p>

              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>

              <div class="warning">
                <strong>⏱️ Important:</strong> This link will expire in 30 minutes for security reasons.
              </div>

              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Link not working?</strong><br>
                Copy and paste this URL into your browser:<br>
                <span style="word-break: break-all;">${resetLink}</span>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MikeAI. All rights reserved.</p>
              <p>This is an automated security email from MikeAI.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending password reset email to', to, ':', error);
      return { success: false, error };
    }

    console.log('✅ Password reset email sent successfully to', to, '- Message ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending password reset email to', to, ':', error);
    return { success: false, error };
  }
}

export async function sendCommonPasswordChangedEmail({
  to,
  firstName,
  organizationName,
  newPassword,
}: CommonPasswordChangedEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${organizationName} - Organization Password Updated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
            .credentials { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f97316; }
            .credential-label { font-weight: 600; color: #4b5563; }
            .credential-value { font-family: monospace; background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 16px; }
            .info { background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Password Updated</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>The organization password for <strong>${organizationName}</strong> has been updated by an administrator.</p>
              
              <div class="credentials">
                <div class="credential-label">New Organization Password:</div>
                <div class="credential-value">${newPassword}</div>
              </div>

              <div class="info">
                <strong>ℹ️ What this means:</strong><br>
                ${`• If you have a personal password set, you can continue using it to log in`}<br>
                ${`• If you don't have a personal password, use this new organization password`}<br>
                ${`• You can set your own personal password anytime in Settings`}
              </div>

              <p style="margin-top: 30px;">
                <strong>Need help?</strong><br>
                If you have questions about this change, please contact your organization administrator.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MikeAI. All rights reserved.</p>
              <p>This is an automated notification from MikeAI.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending common password changed email to', to, ':', error);
      return { success: false, error };
    }

    console.log('✅ Common password changed email sent successfully to', to, '- Message ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending common password changed email to', to, ':', error);
    return { success: false, error };
  }
}
