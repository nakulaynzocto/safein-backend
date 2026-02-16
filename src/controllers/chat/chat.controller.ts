import { Response, NextFunction } from 'express';
import { chatService } from '../../services/chat/chat.service';
import { ResponseUtil, ERROR_CODES } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { TryCatch } from '../../decorators';
import { AppError } from '../../middlewares/errorHandler';
import { UserSubscriptionService } from '../../services/userSubscription/userSubscription.service';

export class ChatController {
    /**
     * Get all chats for the current user
     */
    @TryCatch('Failed to retrieve chats')
    static async getUserChats(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

        const chats = await chatService.getUserChats(req.user._id.toString());
        ResponseUtil.success(res, 'Chats retrieved successfully', chats);
    }

    /**
     * Get messages for a specific chat
     */
    @TryCatch('Failed to retrieve messages')
    static async getMessages(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

        const { chatId } = req.params;
        const { limit, skip } = req.query;

        const messages = await chatService.getMessages(
            chatId,
            limit ? parseInt(limit as string) : 50,
            skip ? parseInt(skip as string) : 0
        );
        ResponseUtil.success(res, 'Messages retrieved successfully', messages);
    }

    /**
     * Initiate a chat with another user
     */
    @TryCatch('Failed to initiate chat')
    static async initiateChat(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

        // Check messaging module access
        await UserSubscriptionService.checkModuleAccess(req.user._id.toString(), 'message');

        const { targetUserId } = req.body;
        if (!targetUserId) throw new AppError('Target user ID is required', ERROR_CODES.BAD_REQUEST);

        const chat = await chatService.getOrCreateChat(req.user._id.toString(), targetUserId);
        ResponseUtil.success(res, 'Chat initiated successfully', chat);
    }

    /**
     * Create a group chat
     */
    @TryCatch('Failed to create group')
    static async createGroup(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

        // Check messaging module access
        await UserSubscriptionService.checkModuleAccess(req.user._id.toString(), 'message');

        const { participantIds, groupName, groupPicture } = req.body;
        if (!participantIds || !Array.isArray(participantIds)) throw new AppError('Participant IDs are required', ERROR_CODES.BAD_REQUEST);
        if (!groupName) throw new AppError('Group name is required', ERROR_CODES.BAD_REQUEST);

        const chat = await chatService.createGroup(req.user._id.toString(), participantIds, groupName, groupPicture);
        ResponseUtil.success(res, 'Group created successfully', chat);
    }

    /**
     * Mark chat as read
     */
    @TryCatch('Failed to mark chat as read')
    static async markRead(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

        const { chatId } = req.params;
        await chatService.markAsRead(chatId, req.user._id.toString());
        ResponseUtil.success(res, 'Chat marked as read');
    }

    /**
     * Send a message (HTTP fallback)
     */
    @TryCatch('Failed to send message')
    static async sendMessage(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);

        // Check messaging module access
        await UserSubscriptionService.checkModuleAccess(req.user._id.toString(), 'message');

        const { chatId } = req.params;
        const { text, files } = req.body;

        const message = await chatService.createMessage(chatId, req.user._id.toString(), text, files);

        // Populate for consistency using service helper
        const populatedMessage = await chatService.populateSender(message);

        ResponseUtil.success(res, 'Message sent successfully', populatedMessage);
    }

    /**
     * Update chat settings (only for group admin)
     */
    @TryCatch('Failed to update group')
    static async updateChat(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        const { chatId } = req.params;
        const { groupName, groupPicture } = req.body;

        const chat = await chatService.getChatById(chatId);
        if (!chat) throw new AppError('Chat not found', ERROR_CODES.NOT_FOUND);

        const isSystemAdmin = req.user.roles.includes('admin') || req.user.roles.includes('superadmin');
        if (String(chat.groupAdmin) !== String(req.user._id) && !isSystemAdmin) {
            throw new AppError('Only group admin or system admin can update settings', ERROR_CODES.FORBIDDEN);
        }

        const updatedChat = await chatService.updateChat(chatId, { groupName, groupPicture });
        ResponseUtil.success(res, 'Group updated successfully', updatedChat);
    }

    /**
     * Add participants to group
     */
    @TryCatch('Failed to add participants')
    static async addParticipants(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        const { chatId } = req.params;
        const { participantIds } = req.body;

        const chat = await chatService.getChatById(chatId);
        if (!chat) throw new AppError('Chat not found', ERROR_CODES.NOT_FOUND);

        const isSystemAdmin = req.user.roles.includes('admin') || req.user.roles.includes('superadmin');
        if (String(chat.groupAdmin) !== String(req.user._id) && !isSystemAdmin) {
            throw new AppError('Only group admin or system admin can add members', ERROR_CODES.FORBIDDEN);
        }

        const updatedChat = await chatService.addParticipants(chatId, participantIds);
        ResponseUtil.success(res, 'Participants added successfully', updatedChat);
    }

    /**
     * Remove participant from group
     */
    @TryCatch('Failed to remove participant')
    static async removeParticipant(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        const { chatId, participantId } = req.params;

        const chat = await chatService.getChatById(chatId);
        if (!chat) throw new AppError('Chat not found', ERROR_CODES.NOT_FOUND);

        const isSystemAdmin = req.user.roles.includes('admin') || req.user.roles.includes('superadmin');
        if (String(chat.groupAdmin) !== String(req.user._id) && !isSystemAdmin) {
            throw new AppError('Only group admin or system admin can remove members', ERROR_CODES.FORBIDDEN);
        }

        const updatedChat = await chatService.removeParticipant(chatId, participantId);
        ResponseUtil.success(res, 'Participant removed successfully', updatedChat);
    }

    /**
     * Delete chat/group
     */
    @TryCatch('Failed to delete chat')
    static async deleteChat(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
        if (!req.user) throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
        const { chatId } = req.params;

        const chat = await chatService.getChatById(chatId);
        if (!chat) throw new AppError('Chat not found', ERROR_CODES.NOT_FOUND);

        const isSystemAdmin = req.user.roles.includes('admin') || req.user.roles.includes('superadmin');
        if (chat.isGroup && String(chat.groupAdmin) !== String(req.user._id) && !isSystemAdmin) {
            throw new AppError('Only group admin or system admin can delete the group', ERROR_CODES.FORBIDDEN);
        }

        await chatService.deleteChat(chatId);
        ResponseUtil.success(res, 'Chat deleted successfully');
    }
}
