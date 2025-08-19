"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    dob: { type: Date },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    passcode: { type: String },
    verified: { type: Boolean, default: false },
    filePath: { type: String, required: true }
});
exports.default = mongoose_1.default.model('user_detail', userSchema);
