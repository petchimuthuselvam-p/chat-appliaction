"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmailListener = void 0;
const kafkajs_1 = require("kafkajs");
const nodemailer_1 = __importDefault(require("nodemailer"));
const kafka = new kafkajs_1.Kafka({
    clientId: 'email-service',
    brokers: ['localhost:9092'],
});
const consumer = kafka.consumer({ groupId: 'email-group' });
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: 'prabhuselvam1998@gmail.com',
        pass: 'yxlk fnrz uvxf iwmq',
    },
});
const sendEmail = (emailData) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Sending email with data:', emailData);
    const { to, subject, text, email, passcode } = emailData;
    const mailOptions = {
        from: 'prabhuselvam1998@gmail.com',
        to: email,
        subject,
        text: `Hello ${to},\n\n${text}\n\nYour verification passcode is: ${passcode}\n\nThank you!`,
    };
    try {
        yield transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
    }
    catch (err) {
        console.error('Email send error:', err);
    }
});
const startEmailListener = () => __awaiter(void 0, void 0, void 0, function* () {
    yield consumer.connect();
    yield consumer.subscribe({ topic: 'send-email', fromBeginning: false });
    yield consumer.run({
        eachMessage: (_a) => __awaiter(void 0, [_a], void 0, function* ({ topic, partition, message }) {
            var _b;
            const value = (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString();
            if (value) {
                const emailData = JSON.parse(value);
                console.log('Received email data:', emailData);
                yield sendEmail(emailData);
            }
        }),
    });
    console.log('Kafka email listener started...');
});
exports.startEmailListener = startEmailListener;
