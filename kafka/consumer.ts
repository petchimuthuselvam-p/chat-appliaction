import { Kafka, EachMessagePayload } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'employee-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'employee-group' });

const run = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'employee-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      const value = message.value?.toString() || '';
      console.log(`Received message from Kafka [${topic}]:`, value);
    },
  });
};

run().catch(console.error);
