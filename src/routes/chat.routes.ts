import { Router } from 'express';
import { ChatController } from '../controllers/chat/chat.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', ChatController.getUserChats);
router.post('/initiate', ChatController.initiateChat);
router.post('/groups', ChatController.createGroup);
router.get('/:chatId/messages', ChatController.getMessages);
router.put('/:chatId/read', ChatController.markRead);
router.post('/:chatId/message', ChatController.sendMessage);

// Group Management Routes
router.patch('/:chatId', ChatController.updateChat);
router.post('/:chatId/participants', ChatController.addParticipants);
router.delete('/:chatId/participants/:participantId', ChatController.removeParticipant);
router.delete('/:chatId', ChatController.deleteChat);

export default router;
