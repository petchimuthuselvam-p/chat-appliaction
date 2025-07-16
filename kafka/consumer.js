const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'employee-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'employee-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'employee-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message from Kafka [${topic}]:`, message.value.toString());
    },
  });
};

run().catch(console.error);
