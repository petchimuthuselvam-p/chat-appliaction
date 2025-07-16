const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// async function sendRegistrationMail(to, userName) {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Employee App" <${process.env.EMAIL_USER}>`,
//       to: to,
//       subject: 'Registration Successful',
//       text: `Hi ${userName}, registered successfully.`,
//     });
//     console.log('Email sent:', info.response);
//   } catch (error) {
//     console.error('Failed to send email:', error);
//   }
// }



async function sendRegistrationMail(to, userName) {
  try {
    const info = await transporter.sendMail({
      from: `"Employee App" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '🎉 Welcome to Chat App!',
      text: `Hi ${userName},\n\nYour registration was successful!\n\nThank you for joining us.\n\nBest regards,\nEmployee App Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">🎉 Welcome to Chat App, ${userName}!</h2>
          <p>We’re excited to let you know that your registration was successful.</p>
          <p>Thank you for joining us!</p>
          <br/>
          <p style="font-size: 0.9em; color: #555;">Best regards,<br/>Employee App Team</p>
        </div>
      `,
    });
    console.log('✅ Email sent:', info.response);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}


module.exports = {
  sendRegistrationMail,
};
