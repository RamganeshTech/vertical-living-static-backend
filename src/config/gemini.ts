import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the client once
export const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});
