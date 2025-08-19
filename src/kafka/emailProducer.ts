import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'auth-service', brokers: ['localhost:9092'] });
const producer = kafka.producer();

export const sendPasscodeEmail = async (emailData: any) => {
  await producer.connect();
  await producer.send({
    topic: 'send-email',
    messages: [{ value: JSON.stringify(emailData) }],
  });
  await producer.disconnect();
};
