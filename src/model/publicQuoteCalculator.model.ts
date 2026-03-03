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
    config: {type: Object, default:{} }
}, { timestamps: true });



const PublicQuoteCalculatorModel = mongoose.model('PublicQuoteCalculator', PublicQuoteSchema);

export default PublicQuoteCalculatorModel