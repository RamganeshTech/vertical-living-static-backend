import { Router } from 'express';
import { handleChat } from '../controllers/chat.controller.js';
import { createPublicQuote, createPublicQuoteV1, sendWhatsAppAutomation } from '../controllers/publicCostCalculator.controller.js';

const publicCostCalculatorRoutes = Router();

// Endpoint: POST /api/v1/chat/ask
// publicCostCalculatorRoutes.post('/generate', createPublicQuote);
publicCostCalculatorRoutes.post('/generate', createPublicQuoteV1);
publicCostCalculatorRoutes.post('/whatsapp/send', sendWhatsAppAutomation);

export default publicCostCalculatorRoutes;