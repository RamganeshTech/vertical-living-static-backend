import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
    // Central document identifier
    configId: { type: String, default: "global_config" },
    
    // Auto-incrementing counter for Quote Ref Numbers
    quoteCounter: { type: Number, default: 0 },
    
    // Marketing text as an array of objects
    marketingText: { 
        type: [{ text: String }], 
        default: [{ text: "Discount up to 50%" }] 
    }
}, { timestamps: true });

// export const AppConfigModel = mongoose.model('AppConfig', appConfigSchema);

const AppConfigModel = mongoose.model('AppConfig', appConfigSchema);

export default AppConfigModel;