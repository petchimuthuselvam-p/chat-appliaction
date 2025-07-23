import { Kafka, Partitioners, Producer } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'employee-app',
  brokers: ['localhost:9092'],
});

const producer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export async function connectProducer(): Promise<void> {
  try {
    console.log('Connecting Kafka Producer...');
    await producer.connect();
    console.log('Kafka Producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka Producer:', error);
  }
}

export async function sendMessage(topic: string, message: any): Promise<void> {
  try {
    console.log(`Sending message to Kafka topic [${topic}]...`);
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent to Kafka topic [${topic}]:`, message);
  } catch (error) {
    console.error('Failed to send message to Kafka:', error);
  }
}
