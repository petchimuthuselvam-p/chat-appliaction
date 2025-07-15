import { Kafka } from 'kafkajs';
import nodemailer from 'nodemailer';

const kafka = new Kafka({
  clientId: 'email-service',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'email-group' });


const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'prabhuselvam1998@gmail.com',      
    pass: 'yxlk fnrz uvxf iwmq',
  },
});

const sendEmail = async (emailData: any) => {
    console.log('Sending email with data:', emailData);
  const { to, subject, text,email,passcode } = emailData;



  const mailOptions = {
    from: 'prabhuselvam1998@gmail.com',
    to:email,
    subject,
    text: `Hello ${to},\n\n${text}\n\nYour verification passcode is: ${passcode}\n\nThank you!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (err) {
    console.error('Email send error:', err);
  }
};

export const startEmailListener = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'send-email', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (value) {
        const emailData = JSON.parse(value);
        console.log('Received email data:', emailData);
        await sendEmail(emailData);
      }
    },
  });

  console.log('Kafka email listener started...');
};
