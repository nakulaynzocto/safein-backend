import mongoose, { Schema } from 'mongoose';
import { IChat } from '../../types/chat/chat.types';

const chatSchema = new Schema<IChat>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            }
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: {}
        },
        isGroup: {
            type: Boolean,
            default: false
        },
        groupName: {
            type: String
        },
        groupPicture: {
            type: String
        },
        groupAdmin: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

chatSchema.index({ participants: 1 }); // Find chat for a pair of users
chatSchema.index({ updatedAt: -1 }); // Sort by latest activity

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
