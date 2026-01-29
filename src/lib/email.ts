import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Sow Plan <forgotpassword@sowplan.com>";

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your Sow Plan password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f3ef; margin: 0; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #5C7A56 0%, #7D9A78 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Sow Plan</h1>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <h2 style="color: #4A3F35; margin: 0 0 16px; font-size: 20px;">Reset Your Password</h2>
                <p style="color: #6B5B4F; line-height: 1.6; margin: 0 0 24px;">
                  We received a request to reset your password. Click the button below to choose a new password. This link will expire in 1 hour.
                </p>

                <a href="${resetLink}" style="display: block; background: linear-gradient(135deg, #5C7A56 0%, #7D9A78 100%); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>

                <p style="color: #8B7B6B; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                  If you didn't request this, you can safely ignore this email. Your password won't be changed.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f5f3ef; padding: 20px; text-align: center;">
                <p style="color: #8B7B6B; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Sow Plan. Happy gardening!
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}
