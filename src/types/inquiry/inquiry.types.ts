import { Document } from 'mongoose';

export interface IInquiry extends Document {
    name: string;
    email: string;
    phone: string;
    message: string;
    source: string;
    status: 'pending' | 'read' | 'responded' | 'closed';
    viewedBy?: {
        userId?: string;
        userName?: string;
    };
    viewedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
