import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();

// POST /api/chat
router.post('/', ChatController.handleChat);

export default router;
