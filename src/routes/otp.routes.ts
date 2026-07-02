import { Router } from 'express';
import { generatePublicQuoteOtp, verifyPublicQuoteOtp } from '../controllers/otp.controller.js';

const PublicCostCalculatorOtpRoutes = Router();

// Endpoint: POST /api/v1/chat/ask
// PublicCostCalculatorOtpRoutes.post('/generate', createPublicQuote);
PublicCostCalculatorOtpRoutes.post('/generate', generatePublicQuoteOtp);
PublicCostCalculatorOtpRoutes.post('/verify', verifyPublicQuoteOtp);

export default PublicCostCalculatorOtpRoutes;