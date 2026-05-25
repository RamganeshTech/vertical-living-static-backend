import mongoose from 'mongoose';

const PublicQuoteSchema = new mongoose.Schema({
    name: { type: String },
    phone: { type: String },
    location: { type: String },
    carpetArea: { type: Number },
    homeType: { type: String },
    finish: { type: String },
    estimate: { type: Number },
    // Store S3 metadata just like your Club thumbnail
    quotationPdf: {
        url: String,
        key: String,
        originalName: String,
        uploadedAt: { type: Date, default: new Date() }
    },
    config: { type: Object, default: {} },
    consent: { type: Boolean, default: null },
    source: { type: String, default: null },
    quoteRefNo: { type: String, default: null },
}, { timestamps: true });



// // ✅ Pre-save hook to auto-generate unique Quote Number per Organization
// PublicQuoteSchema.pre("save", async function (next: any) {
//     if (this.isNew && !this.quoteRefNo) {
//         const currentYear = new Date().getFullYear();

//         const lastDoc = await mongoose
//             .model("PublicQuoteCalculator")
//             .findOne()
//             .sort({ createdAt: -1 });

//         let nextNumber = 1;
//         if (lastDoc && lastDoc.quoteRefNo) {
//             // This regex extracts the numeric part from the end of the string
//             const match = lastDoc.quoteRefNo.match(/(\d+)$/);
//             if (match) nextNumber = parseInt(match[1]) + 1;
//         }
//         this.quoteRefNo = `QT-VL-${String(nextNumber).padStart(3, "0")}`;
//     }
//     next();
// });


const PublicQuoteCalculatorModel = mongoose.model('PublicQuoteCalculator', PublicQuoteSchema);

export default PublicQuoteCalculatorModel