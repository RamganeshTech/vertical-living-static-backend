import { type Request, type Response } from 'express';
import AppConfigModel from '../model/appConfig.model.js';
// import { AppConfigModel } from '../model/appconfig.model.js';

// ==========================================
// GET: Fetch the current Global Config
// ==========================================
export const getAppConfig = async (req: Request, res: Response) => {
    try {
        // Find the global config. If it doesn't exist, mongoose returns null.
        let config = await AppConfigModel.findOne({ configId: "global_config" });

        if (!config) {
            // Return a default structure if it hasn't been created yet
            return res.status(200).json({
                ok: true,
                data: {
                    quoteCounter: 0,
                    marketingText: [{ text: "Discount up to 50%" }]
                }
            });
        }

        res.status(200).json({
            ok: true,
            data: config
        });
    } catch (error) {
        console.error("Error fetching config:", error);
        res.status(500).json({ ok: false, message: "Server error fetching configuration" });
    }
};

// ==========================================
// PUT: Update the Marketing Text Array
// ==========================================
export const updateMarketingText = async (req: Request, res: Response) => {
    try {
        const { marketingText } = req.body;

        // --- STRICT VALIDATION ---
        // 1. Check if it is an array
        if (!marketingText || !Array.isArray(marketingText)) {
            return res.status(400).json({
                ok: false,
                message: "marketingText must be an array of objects."
            });
        }

        // 2. Check the length limit (Maximum 2 items)
        if (marketingText.length > 2) {
            return res.status(400).json({
                ok: false,
                message: "You can only have a maximum of 2 marketing text items."
            });
        }

        // 3. Ensure every item in the array has a valid 'text' string property
        const isValidStructure = marketingText.every(item => item && typeof item.text === 'string'
            // && item.text.trim() !== ''
        );
        if (!isValidStructure) {
            return res.status(400).json({
                ok: false,
                message: "Every item in the array must be an object with a non-empty 'text' property. Example: [{ text: 'Offer 1' }]"
            });
        }

        // --- UPDATE DATABASE ---
        // Overwrite the existing array in a single go. Upsert creates it if missing.
        const updatedConfig = await AppConfigModel.findOneAndUpdate(
            { configId: "global_config" },
            { $set: { marketingText: marketingText } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            ok: true,
            message: "Marketing text updated successfully",
            data: updatedConfig.marketingText
        });

    } catch (error) {
        console.error("Error updating marketing text:", error);
        res.status(500).json({ ok: false, message: "Server error updating marketing text" });
    }
};