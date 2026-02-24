import { Router } from 'express';
import { handleChat } from '../controllers/chat.controller.js';
import { createPublicQuote } from '../controllers/publicCostCalculator.controller.js';

const publicCostCalculatorRoutes = Router();

// Endpoint: POST /api/v1/chat/ask
publicCostCalculatorRoutes.post('/generate', createPublicQuote);

export default publicCostCalculatorRoutes;