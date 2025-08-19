"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const groupMessage = new mongoose_1.default.Schema({
    groupId: mongoose_1.default.Schema.Types.ObjectId,
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
});
exports.GroupMessage = mongoose_1.default.model('GroupMessage', groupMessage);
