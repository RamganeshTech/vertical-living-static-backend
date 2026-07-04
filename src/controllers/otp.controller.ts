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

// const OTP_TEMPLATE_NAME = "cost_calculator_prior_template"; // e.g., "cost_calculator_utility"
const WHATSAPP_TOKEN = process.env.PERMANENT_WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;


export const sendWhatsappOtp = async ({ name, phone, otp, otpTemplateName }: { name: string, phone: string, otp: string, otpTemplateName: "cost_calculator_prior_template" | "inquiry_form_prior_template" }) => {
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    return axios.post(
        // `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
        `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,

        {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: otpTemplateName,
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


const VALID_FORM_SOURCES = ["cost_calculator", "inquiry_form"] as const;
type FormSource = typeof VALID_FORM_SOURCES[number];

function isValidFormSource(value: unknown): value is FormSource {
    return VALID_FORM_SOURCES.includes(value as FormSource);
}


export const generatePublicQuoteOtp = async (req: Request, res: Response) => {
    try {
        const { phone, name, formSource } = req.body;
        if (!phone || !/^\d{10}$/.test(phone)) {
            return res.status(400).json({ ok: false, message: "Valid 10-digit phone required" });
        }

        // if(formSource !== "cost_calculator" || formSource !== "inquiry_form"){
        //     return res.status(400).json({ ok: false, message: "form source should be either cost_calculator or inquiry_form" });
        // }


        if (!isValidFormSource(formSource)) {
            return res.status(400).json({ ok: false, message: "form source should be either cost_calculator or inquiry_form" });
        }


        const FORMTEMPLATE_MAP: Record<FormSource, "cost_calculator_prior_template" | "inquiry_form_prior_template"> = {
            cost_calculator: "cost_calculator_prior_template",
            inquiry_form: "inquiry_form_prior_template"
        };


        const existing = await OtpModel.findOne({ phone, purpose: formSource }).sort({ createdAt: -1 });

        if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
            const waitMs = RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime());
            return res.status(429).json({ ok: false, message: "Please wait before requesting another OTP", retryAfterMs: waitMs });
        }



        // Invalidate any previous unverified OTP for this phone
        await OtpModel.deleteMany({ phone, purpose: formSource, verified: false });

        const otp = generateSixDigitOtp();
        const otpHash = await bcrypt.hash(otp, 10);

        await OtpModel.create({
            phone,
            purpose: formSource,
            otpHash,
            otp,
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
            lastSentAt: new Date(),
        });



        await sendWhatsappOtp({ name, phone, otp, otpTemplateName: FORMTEMPLATE_MAP[formSource] });

        return res.status(200).json({ ok: true, message: "OTP sent to WhatsApp", });
    } catch (error: any) {
        console.error("generate otp error:", error.message);
        return res.status(500).json({ ok: false, message: "Failed to send OTP" });
    }
};

export const verifyPublicQuoteOtp = async (req: Request, res: Response) => {
    try {
        const { phone, otp, formSource } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ ok: false, message: "Phone and OTP required" });
        }

        if (!isValidFormSource(formSource)) {
            return res.status(400).json({ ok: false, message: "Invalid form source" });
        }

        const record = await OtpModel.findOne({ phone, purpose: formSource }).sort({ createdAt: -1 });

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
        console.error("verifying otp error:", error);
        return res.status(500).json({ ok: false, message: "Failed to verify OTP" });
    }
};

