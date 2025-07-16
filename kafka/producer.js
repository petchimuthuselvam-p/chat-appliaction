const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'employee-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

async function connectProducer() {
  try {
    console.log('Connecting Kafka Producer...');
    await producer.connect();
    console.log('Kafka Producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka Producer:', error);
  }
}

async function sendMessage(topic, message) {
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

module.exports = {
  connectProducer,
  sendMessage,
};
