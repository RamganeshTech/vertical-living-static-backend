import { Router } from 'express';
import { handleChat } from '../controllers/chat.controller.js';

const chatRoutes = Router();

// Endpoint: POST /api/v1/chat/ask
chatRoutes.post('/ask', handleChat);

export default chatRoutes;