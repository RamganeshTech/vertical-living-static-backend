// controllers/publicQuoteOtp.controller.ts
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { type Request, type Response } from "express";
import { OtpModel } from "../model/otp.model.js";
import axios from "axios";

// import { OtpModel } from "../models/PublicQuoteOtp.model";
// import { sendWhatsappOtp } from "../utils/sendWhatsappOtp";





// utils/sendWhatsappOtp.ts

// const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
// const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;

const OTP_TEMPLATE_NAME = "cost_calculator_prior_template"; // e.g., "cost_calculator_utility"
const WHATSAPP_TOKEN = process.env.PERMANENT_WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;


export const sendWhatsappOtp = async (name: string, phone: string, otp: string) => {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    return axios.post(
        // `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
        `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,

        {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: OTP_TEMPLATE_NAME,
                language: { code: "en" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: name }, // {{1}} User's Name
                            { type: "text", text: otp }   // {{2}} The OTP / Access Key
                        ]
                    }
                ]
            }
        },
        { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
};


const OTP_TTL_MS = 15 * 60 * 1000;        // 5 min OTP validity
const TOKEN_TTL_MS = 15 * 60 * 1000;     // 15 min to actually submit after verifying
const RESEND_COOLDOWN_MS = 30 * 1000;    // 30s between sends

const generateSixDigitOtp = () => String(crypto.randomInt(100000, 999999));

export const generatePublicQuoteOtp = async (req: Request, res: Response) => {
    try {
        const { phone, name } = req.body;
        if (!phone || !/^\d{10}$/.test(phone)) {
            return res.status(400).json({ ok: false, message: "Valid 10-digit phone required" });
        }

        const existing = await OtpModel.findOne({ phone, purpose: "public_quote" }).sort({ createdAt: -1 });

        if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
            return res.status(429).json({ ok: false, message: "Please wait before requesting another OTP" });
        }

        // Invalidate any previous unverified OTP for this phone
        await OtpModel.deleteMany({ phone, purpose: "public_quote", verified: false });

        const otp = generateSixDigitOtp();
        const otpHash = await bcrypt.hash(otp, 10);

        await OtpModel.create({
            phone,
            purpose: "public_quote",
            otpHash,
            otp,
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
            lastSentAt: new Date(),
        });

        await sendWhatsappOtp(name, phone, otp);

        return res.status(200).json({ ok: true, message: "OTP sent to WhatsApp", });
    } catch (error: any) {
        console.error("generatePublicQuoteOtp error:", error.message);
        return res.status(500).json({ ok: false, message: "Failed to send OTP" });
    }
};

export const verifyPublicQuoteOtp = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ ok: false, message: "Phone and OTP required" });
        }

        const record = await OtpModel.findOne({ phone, purpose: "public_quote" }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({ ok: false, message: "No OTP found. Please request a new one." });
        }
        if (record.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ ok: false, message: "OTP expired. Please request a new one." });
        }
        if (record.attempts >= record.maxAttempts) {
            return res.status(429).json({ ok: false, message: "Too many attempts. Please request a new OTP." });
        }

        const isMatch = await bcrypt.compare(otp, record.otpHash);
        if (!isMatch) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({
                ok: false,
                message: "Incorrect OTP",
                attemptsLeft: record.maxAttempts - record.attempts
            });
        }

        const verificationToken = crypto.randomBytes(24).toString("hex");
        record.verified = true;
        record.verificationToken = verificationToken;
        record.tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
        await record.save();

        return res.status(200).json({ ok: true, message: "OTP verified", verificationToken });
    } catch (error) {
        console.error("verifyPublicQuoteOtp error:", error);
        return res.status(500).json({ ok: false, message: "Failed to verify OTP" });
    }
};

