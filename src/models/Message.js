"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const MessageSchema = new mongoose_1.default.Schema({
    from: String,
    to: String,
    message: String,
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    timestamp: { type: Date, default: Date.now },
    filePath: String,
    createdAt: Date, // ✅ Added
    updatedAt: Date // ✅ Added
});
exports.default = mongoose_1.default.model('Message', MessageSchema);
