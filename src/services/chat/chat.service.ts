import mongoose from 'mongoose';
import { Chat } from '../../models/chat/chat.model';
import { Message } from '../../models/chat/message.model';
import { IChat, IMessage } from '../../types/chat/chat.types';
import { Employee } from '../../models/employee/employee.model';
import { User } from '../../models/user/user.model';

class ChatService {
    /**
     * Helper to fetch details for a list of user/employee IDs
     * Consolidates logic to check both User and Employee collections
     */
    private async _getParticipantDetails(ids: string[]): Promise<Map<string, any>> {
        const uniqueIds = Array.from(new Set(ids.map(id => String(id))));
        if (uniqueIds.length === 0) return new Map();

        // 1. Fetch Users
        const users = await User.find({ _id: { $in: uniqueIds } })
            .select('name profilePicture email role updatedAt lastLoginAt')
            .lean();

        // 2. Identify missing IDs (potential Employees)
        const foundUserIds = new Set(users.map(u => String(u._id)));
        const missingIds = uniqueIds.filter(id => !foundUserIds.has(id));

        let employees: any[] = [];
        if (missingIds.length > 0) {
            employees = await Employee.find({ _id: { $in: missingIds } })
                .select('name profilePicture email role updatedAt')
                .lean();
        }

        // 3. Create Merged Map
        const personMap = new Map<string, any>();
        users.forEach(u => personMap.set(String(u._id), u));
        // Force 'employee' role if not present, though Model should have it
        employees.forEach(e => personMap.set(String(e._id), { ...e, role: e.role || 'employee' }));

        return personMap;
    }

    /**
     * Find existing chat between two users or create a new one
     */
    async getOrCreateChat(user1: string, user2: string): Promise<IChat> {
        let chat = await Chat.findOne({
            participants: { $all: [user1, user2] },
            isActive: true
        }).populate('lastMessage').lean();

        if (!chat) {
            const newChat = await Chat.create({
                participants: [user1, user2],
                unreadCounts: {
                    [user1]: 0,
                    [user2]: 0
                }
            });
            // Convert to plain object for manipulation
            chat = newChat.toObject() as any;
        }

        // Populate Participants
        const participantIds = [user1, user2];
        const personMap = await this._getParticipantDetails(participantIds);

        const populatedParticipants = participantIds.map(id => {
            const p = personMap.get(String(id));
            return p || { _id: id, name: 'Unknown User', email: '', role: 'user' };
        });

        // Return populated chat
        return { ...chat, participants: populatedParticipants } as any;
    }

    /**
     * Create a new message in a chat
     */
    async createMessage(
        chatId: string,
        senderId: string,
        text: string,
        files: { url: string; name: string; type: string }[] = []
    ): Promise<IMessage> {
        // Create message first
        const message = await Message.create({
            chatId,
            senderId,
            text,
            files,
            readBy: [senderId], // Sender has read it
        });

        // Update Chat: specific unread counts logic
        const chat = await Chat.findById(chatId);
        if (chat) {
            chat.lastMessage = message._id as any;

            // Update unread counts
            chat.participants.forEach((pId) => {
                const participantId = pId.toString();
                if (participantId !== senderId.toString()) {
                    const currentCount = chat.unreadCounts.get(participantId) || 0;
                    chat.unreadCounts.set(participantId, currentCount + 1);
                }
            });

            await chat.save();
        }

        return message;
    }

    /**
     * Mark chat as read for a specific user
     */
    async markAsRead(chatId: string, userId: string): Promise<void> {
        const chat = await Chat.findById(chatId);
        if (chat) {
            // Update unread counts if user is in map
            if (chat.unreadCounts.has(userId)) {
                chat.unreadCounts.set(userId, 0);
            } else {
                // Failsafe: Ensure user is in map if they are a participant
                chat.unreadCounts.set(userId, 0);
            }
            await chat.save();

            // Update all messages in this chat that don't have this userId in readBy
            await Message.updateMany(
                { chatId, readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );

            // Notify via socket
            const { socketService, SocketEvents } = require('../socket/socket.service');
            socketService.getInstance().getIO()?.to(`chat_${chatId}`).emit(SocketEvents.READ_RECEIPT, {
                chatId,
                userId,
                timestamp: new Date()
            });
        }
    }

    /**
     * Get messages for a chat with pagination
     * Manually populates sender details from User or Employee collection
     */
    async getMessages(chatId: string, limit: number = 50, skip: number = 0): Promise<IMessage[]> {
        const messages = await Message.find({ chatId })
            .sort({ createdAt: -1 }) // Newest first (To get the latest conversation)
            .skip(skip)
            .limit(limit)
            .lean();

        // Re-order to chronological (Oldest -> Newest) for correct display
        const chronologicalMessages = messages.reverse();

        // Populate Senders
        const senderIds = chronologicalMessages.map(m => String(m.senderId));
        const personMap = await this._getParticipantDetails(senderIds);

        // Attach sender info to messages
        return chronologicalMessages.map(msg => ({
            ...msg,
            senderId: personMap.get(String(msg.senderId)) || { _id: msg.senderId, name: 'Unknown', email: '' } // Fallback
        })) as unknown as IMessage[];
    }

    /**
     * Get all chats for a user, including empty "potential" chats for all employees.
     * Manually populates participants from User or Employee collection
     */
    async getUserChats(userId: string): Promise<IChat[]> {
        // Find user to check for employeeId
        const currentUser = await User.findById(userId).lean();
        const searchIds: any[] = [userId, new mongoose.Types.ObjectId(userId)];
        if (currentUser?.employeeId) {
            searchIds.push(currentUser.employeeId);
            searchIds.push(String(currentUser.employeeId));
        }

        const existingChats = await Chat.find({
            participants: { $in: searchIds },
            isActive: true
        })
            .sort({ updatedAt: -1 })
            .limit(500) // Optimization: Limit active chats to prevent overload
            .populate('lastMessage')
            .lean();

        // 2. Collect all unique participant IDs
        const participantIds = new Set<string>();
        existingChats.forEach(chat => {
            if (Array.isArray(chat.participants)) {
                chat.participants.forEach(pId => participantIds.add(String(pId)));
            }
        });

        // 3. Fetch participant details using the helper
        const personMap = await this._getParticipantDetails(Array.from(participantIds));

        // 4. Populate Participants in Existing Chats
        const populatedChats = existingChats.map(chat => {
            const populatedParticipants = (chat.participants as any[]).map(pId => {
                const pInfo = personMap.get(String(pId));
                return pInfo || { _id: pId, name: 'Unknown User', email: '', role: 'user' };
            });
            return { ...chat, participants: populatedParticipants };
        });


        // 5. Fetch all employees created by this user (Admin) for Virtual Chats
        const allEmployees = await Employee.find({
            createdBy: userId,
            isDeleted: false
        })
            .select('name email profilePicture role _id')
            .sort({ createdAt: -1 }) // Show newest employees first
            .limit(3000) // Optimization: Limit to 3000 to prevent large data payload issues
            .lean();

        // 6. Create a Set of target User IDs already in chats
        const existingChatTargetIds = new Set<string>();
        populatedChats.forEach(chat => {
            chat.participants.forEach((p: any) => {
                if (String(p._id) !== String(userId)) {
                    existingChatTargetIds.add(String(p._id));
                }
            });
        });

        // 7. Create "Virtual Chats" for employees not yet in chat list
        const virtualChats: IChat[] = allEmployees
            .filter(emp => !existingChatTargetIds.has(String(emp._id)))
            .map(emp => ({
                _id: emp._id, // Use employee ID as chat ID for virtual chats
                participants: [
                    { _id: userId }, // Current User
                    // The Employee
                    {
                        _id: emp._id,
                        name: emp.name,
                        email: emp.email,
                        role: 'employee',
                        profilePicture: (emp as any).profilePicture
                    }
                ],
                lastMessage: null,
                unreadCounts: { [userId]: 0 },
                isActive: true,
                isVirtual: true, // Custom flag for virtual chats
                createdAt: new Date(),
                updatedAt: new Date(0) // Default date
            } as any));

        // 8. Return Merged List
        return [...populatedChats, ...virtualChats] as unknown as IChat[];
    }

    /**
     * Create a new group chat
     */
    async createGroup(adminId: string, participantIds: string[], groupName: string, groupPicture?: string): Promise<IChat> {
        // Ensure admin is a participant
        const allParticipants = Array.from(new Set([...participantIds, adminId]));

        const unreadCounts: Record<string, number> = {};
        allParticipants.forEach(id => {
            unreadCounts[id] = 0;
        });

        const newChat = await Chat.create({
            participants: allParticipants,
            isGroup: true,
            groupName,
            groupPicture,
            groupAdmin: adminId,
            unreadCounts
        });

        const chat = newChat.toObject();

        // Populate Participants
        const personMap = await this._getParticipantDetails(allParticipants);
        const populatedParticipants = allParticipants.map(id => {
            const p = personMap.get(String(id));
            return p || { _id: id, name: 'Unknown User', email: '', role: 'user' };
        });

        return { ...chat, participants: populatedParticipants } as any;
    }

    /**
     * Get chat by ID
     */
    async getChatById(chatId: string): Promise<IChat | null> {
        const chat = await Chat.findById(chatId).lean();
        if (!chat) return null;

        const personMap = await this._getParticipantDetails(chat.participants.map(p => String(p)));
        const populatedParticipants = chat.participants.map(id => {
            const p = personMap.get(String(id));
            return p || { _id: id, name: 'Unknown User', email: '', role: 'user' };
        });

        return { ...chat, participants: populatedParticipants } as any;
    }

    /**
     * Update chat info (Group Name, Picture)
     */
    async updateChat(chatId: string, data: { groupName?: string; groupPicture?: string }): Promise<IChat | null> {
        const chat = await Chat.findByIdAndUpdate(chatId, { $set: data }, { new: true }).lean();
        if (!chat) return null;
        return this.getChatById(chatId);
    }

    /**
     * Add participants to a group
     */
    async addParticipants(chatId: string, participantIds: string[]): Promise<IChat | null> {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return null;

        // Add new participants, avoiding duplicates
        const currentParticipants = chat.participants.map(p => String(p));
        participantIds.forEach(id => {
            if (!currentParticipants.includes(id)) {
                chat.participants.push(id as any);
            }
        });

        // Ensure unreadCounts has entry for new members
        if (!chat.unreadCounts) {
            chat.unreadCounts = new Map();
        }

        participantIds.forEach(id => {
            if (!chat.unreadCounts.has(id)) {
                chat.unreadCounts.set(id, 0);
            }
        });

        await chat.save();
        return this.getChatById(chatId);
    }

    /**
     * Remove a participant from a group
     */
    async removeParticipant(chatId: string, participantId: string): Promise<IChat | null> {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return null;

        // Cannot remove the admin easily without assigning a new one, but for now just filter
        chat.participants = chat.participants.filter(p => String(p) !== participantId) as any;
        chat.unreadCounts.delete(participantId);

        await chat.save();
        return this.getChatById(chatId);
    }

    /**
     * Delete a chat/group
     */
    async deleteChat(chatId: string): Promise<boolean> {
        const result = await Chat.findByIdAndDelete(chatId);
        if (result) {
            // Also delete messages
            await Message.deleteMany({ chatId });
            return true;
        }
        return false;
    }
}

export const chatService = new ChatService();
