// models/PublicQuoteOtp.model.ts
import { Schema, model } from "mongoose";

const PublicQuoteOtpSchema = new Schema({
    phone: { type: String, required: true, index: true },
    purpose: { type: String, default: "cost_calculator" },

    otpHash: { type: String, required: true },
    otp: {type:String, default: null},
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },

    verified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },

    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }, // OTP validity (5 min)
}, { timestamps: true });

// TTL cleanup - doc auto-deletes 15 min after OTP expiry, regardless of verification state
PublicQuoteOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

export const OtpModel = model("OtpModel", PublicQuoteOtpSchema);