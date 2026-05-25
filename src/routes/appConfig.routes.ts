import { Router } from 'express';
import { getAppConfig, updateMarketingText } from '../controllers/appConfig.controller.js';
// Ensure the path matches where you saved the controller in the previous step

const appConfigRoutes = Router();

// Endpoint: GET /api/v1/app-config/
// Fetches the global configuration (Quote Counter, Marketing Text, etc.)
appConfigRoutes.get('/get', getAppConfig);

// Endpoint: PUT /api/v1/app-config/marketing-text
// Updates the marketing text array (Max 2 objects)
appConfigRoutes.put('/marketing-text', updateMarketingText);

export default appConfigRoutes;