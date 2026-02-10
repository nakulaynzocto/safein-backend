import { Document, Types } from 'mongoose';

export interface IFile {
    url: string;
    name: string;
    type: string;
}

export interface IMessage extends Document {
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    text: string;
    files: IFile[];
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IChat extends Document {
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId | IMessage;
    unreadCounts: Map<string, number>; // key: userId, value: count
    isGroup: boolean;
    groupName?: string;
    groupPicture?: string;
    groupAdmin?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
