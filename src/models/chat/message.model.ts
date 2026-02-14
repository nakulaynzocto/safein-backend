import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../../types/chat/chat.types';

const messageSchema = new Schema<IMessage>(
    {
        chatId: {
            type: Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
            index: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            default: '' // Can be empty if files sent
        },
        files: [
            {
                url: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String, required: true }
            }
        ],
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

messageSchema.index({ chatId: 1, createdAt: -1 }); // Efficient pagination

export const Message = mongoose.model<IMessage>('Message', messageSchema);
