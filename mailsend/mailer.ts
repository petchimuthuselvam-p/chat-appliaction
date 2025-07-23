import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a registration email to a user.
 * @param to - Email address of the recipient
 * @param userName - Name of the user
 */
export async function sendRegistrationMail(to: string, userName: string): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: `"Employee App" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `🎉 Welcome ${userName}`,
      text: `Hi ${userName},\n\nWe would like to let you know that your user account has been created successfully.\n\nBest regards,\nEmployee App Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>We would like to let you know that your user account has been created successfully.</p>
          <br/>
          <p style="font-size: 0.9em; color: #555;">Best regards,<br/>Admin Team</p>
        </div>
      `,
    });

    console.log('✅ Email sent:', info.response);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}
