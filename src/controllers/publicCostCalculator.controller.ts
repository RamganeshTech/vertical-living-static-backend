import PublicQuoteCalculatorModel from '../model/publicQuoteCalculator.model.js';
import type { Request, Response } from 'express';
// import { PDFDocument, PDFImage, PDFName, rgb, StandardFonts } from 'pdf-lib';
import { PDFDocument, rgb, StandardFonts, PDFName, PDFString, PDFArray, drawText } from 'pdf-lib';
import { uploadFileToS3New } from '../utils/s3UploadsNew.js';
import axios from 'axios';
import { AppConfigModel } from '../model/appconfig.model.js';

// import { PublicQuoteModel } from '../models/PublicQuoteModel.js';
// import { uploadBufferToS3 } from '../utils/s3Config.js';


// Helper function to format the file object for your UploadSchema
export const formatUploadData = async (file: any) => {
    if (!file) return null;
    const uploadData = await uploadFileToS3New(file);
    const type = file.mimetype.startsWith("image") ? "image" : "video";
    return {
        url: uploadData.url,
        key: uploadData.key,
        type: type,
        originalName: file.originalname,
        uploadedAt: new Date()
    };
};

// Package configuration
// const PACKAGES = {
//     Core: { name: 'Core Package', color: rgb(0.2, 0.6, 0.2), bgColor: rgb(0.9, 1, 0.9) },
//     Prime: { name: 'Prime Package', color: rgb(0.8, 0.5, 0), bgColor: rgb(1, 0.95, 0.9) },
//     Basic: { name: 'Basic Package', color: rgb(0.4, 0.4, 0.8), bgColor: rgb(0.9, 0.9, 1) }
// };

// Sample interior design images (replace with your actual image URLs)
const INTERIOR_IMAGES = [
    { url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=300&fit=crop", name: "Modular Kitchen", category: "modular-kitchen" },
    { url: "https://images.unsplash.com/photo-1616486338812-3badae4b4b1c?w=400&h=300&fit=crop", name: "Pooja Unit", category: "pooja-unit" },
    { url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=300&fit=crop", name: "Sliding Wardrobe", category: "sliding-wardrobe" },
    { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop", name: "TV Unit", category: "tv-unit" },
    { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop", name: "Storage Solution", category: "storage" }
];

// Package configurations
const PACKAGES = {
    Core: {
        name: 'Core Package',
        color: rgb(0.2, 0.6, 0.2),
        bgColor: rgb(0.9, 1, 0.9),
        includedItems: {
            left: [
                "BWR Plywood carcass (IS:710 grade)",
                "Good quality granite / basic quartz top",
                "1mm High-Pressure Laminate finish",
                "2mm PVC edge banding throughout"
            ],
            right: [
                "Hettich soft-close concealed hinges",
                "Hettich Quadro undermount channels",
                "Basic locker shelf in wardrobe",
                "Factory finish + site installation"
            ]
        }
    },
    Prime: {
        name: 'Prime Package',
        color: rgb(0.8, 0.5, 0),
        bgColor: rgb(1, 0.95, 0.9),
        includedItems: {
            left: [
                "Premium BWR Plywood carcass (IS:710 grade)",
                "Premium granite / quartz top with edging",
                "Premium Acrylic/High-Pressure Laminate finish",
                "2mm PVC edge banding throughout",
                "Hettich soft-close concealed hinges (Premium)"
            ],
            right: [
                "Hettich Quadro undermount channels (Soft-close)",
                "Hettich TopLine sliding wardrobe system",
                "Bottle pull-out, cutlery tray & basket",
                "Premium locker shelf with digital lock",
                "5-year workmanship warranty"
            ]
        }
    },
    Basic: {
        name: 'Basic Package',
        color: rgb(0.4, 0.4, 0.8),
        bgColor: rgb(0.9, 0.9, 1),
        includedItems: {
            left: [
                "Commercial Plywood carcass",
                "Basic granite top",
                "Laminate finish",
                "Standard edge banding"
            ],
            right: [
                "Standard hinges",
                "Basic drawer channels",
                "Standard installation",
                "1-year workmanship warranty"
            ]
        }
    }
};



export const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";
export const COMPANY_NAME = "Vertical Living";
export const createPublicQuote = async (req: Request, res: Response) => {
    try {
        const { name, phone, location, carpetArea, homeType, finish, estimate, config, consent, source } = req.body;



        if (!consent) {
            return res.status(400).json({ message: "consent should be true or accepted", ok: false })
        }

        // 1. Create PDF via pdf-lib
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // US Letter size
        const { width, height } = page.getSize();

        // Load fonts
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Color Palette
        const yellowColor = rgb(1, 0.8, 0); // Bright Yellow #FFCC00
        const blackColor = rgb(0, 0, 0); // Pure Black
        const blueColor = rgb(0, 0.4, 0.8); // Royal Blue #0066CC
        const lightGray = rgb(0.95, 0.95, 0.95); // Light Gray for backgrounds
        const whiteColor = rgb(1, 1, 1);
        const darkGray = rgb(0.3, 0.3, 0.3); // Dark Gray for text

        // Clean white background
        page.drawRectangle({
            x: 0, y: 0,
            width: width,
            height: height,
            color: whiteColor,
        });

        // ===== HEADER SECTION WITH LOGO =====
        let yPosition = height - 40;

        // Try to fetch and embed logo using the provided method
        try {
            const logoRes = await fetch(COMPANY_LOGO);
            const logoBuffer = await logoRes.arrayBuffer();

            // Try to determine image type and embed accordingly
            let logoImage;
            try {
                logoImage = await pdfDoc.embedJpg(logoBuffer);
            } catch {
                logoImage = await pdfDoc.embedPng(logoBuffer);
            }

            const logoScale = 0.5;
            const logoDims = logoImage.scale(logoScale);

            const brandText = COMPANY_NAME;
            const brandFontSize = 24;
            const brandColor = blueColor;
            const brandTextWidth = helveticaBold.widthOfTextAtSize(brandText, brandFontSize);

            const spacing = 10; // space between logo and text

            // Total width = logo + spacing + text
            const totalWidth = logoDims.width + spacing + brandTextWidth;

            // X and Y to center the whole block horizontally
            const combinedX = (width - totalWidth) / 2;
            const topY = yPosition;

            // Draw logo
            page.drawImage(logoImage, {
                x: combinedX,
                y: topY - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Align text vertically with logo
            const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);

            // Draw text next to logo
            page.drawText(brandText, {
                x: combinedX + logoDims.width + spacing,
                y: textY,
                size: brandFontSize,
                font: helveticaBold,
                color: brandColor,
            });

            // Update yPosition to be below the logo
            yPosition = topY - logoDims.height - 15;

            // Draw horizontal line
            page.drawLine({
                start: { x: 50, y: yPosition },
                end: { x: width - 50, y: yPosition },
                thickness: 1,
                color: lightGray,
            });

            yPosition -= 25;
        } catch (err) {
            console.error("Failed to load company logo:", err);
            // Fallback to text only
            page.drawText('VERTICAL LIVING', {
                x: 40,
                y: yPosition,
                size: 28,
                color: blueColor,
                font: helveticaBold
            });
            yPosition -= 30;

            page.drawLine({
                start: { x: 40, y: yPosition },
                end: { x: width - 40, y: yPosition },
                thickness: 1,
                color: lightGray,
            });
            yPosition -= 20;
        }

        // Quotation badge on right side
        // page.drawRectangle({
        //     x: width - 150,
        //     y: yPosition + 15,
        //     width: 120,
        //     height: 35,
        //     color: yellowColor,
        // });

        // page.drawText('QUOTATION', {
        //     x: width - 135,
        //     y: yPosition + 30,
        //     size: 16,
        //     color: blackColor,
        //     font: helveticaBold
        // });

        // // Quote reference
        // const quoteRef = `Q-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        // page.drawText(quoteRef, {
        //     x: width - 135,
        //     y: yPosition + 15,
        //     size: 8,
        //     color: darkGray,
        //     font: helvetica
        // });

        // ===== CLIENT INFORMATION SECTION =====
        page.drawText('CLIENT INFORMATION', {
            x: 40,
            y: yPosition,
            size: 14,
            color: blueColor,
            font: helveticaBold
        });

        // Yellow underline
        page.drawRectangle({
            x: 40,
            y: yPosition - 10,
            width: 150,
            height: 2,
            color: yellowColor,
        });

        yPosition -= 30;

        // Client details in a clean layout
        const clientData = [
            { label: 'Full Name:', value: name },
            { label: 'Phone Number:', value: phone },
            { label: 'Project Location:', value: location },
        ];

        // Left side - Client details
        let clientY = yPosition;
        clientData.forEach((item) => {
            page.drawText(item.label, {
                x: 40,
                y: clientY,
                size: 10,
                color: darkGray,
                font: helvetica
            });

            page.drawText(item.value, {
                x: 150,
                y: clientY,
                size: 12,
                color: blackColor,
                font: helveticaBold
            });

            clientY -= 20;
        });

        // Right side - Date
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        page.drawText('Date:', {
            x: width - 200,
            y: yPosition,
            size: 10,
            color: darkGray,
            font: helvetica
        });

        page.drawText(dateStr, {
            x: width - 150,
            y: yPosition,
            size: 12,
            color: blackColor,
            font: helveticaBold
        });

        // Valid until
        // const validUntil = new Date(today.setDate(today.getDate() + 30));
        // const validUntilStr = validUntil.toLocaleDateString('en-IN', {
        //     day: 'numeric',
        //     month: 'long',
        //     year: 'numeric'
        // });

        // page.drawText('Valid Until:', {
        //     x: width - 200,
        //     y: yPosition - 20,
        //     size: 10,
        //     color: darkGray,
        //     font: helvetica
        // });

        // page.drawText(validUntilStr, {
        //     x: width - 150,
        //     y: yPosition - 20,
        //     size: 12,
        //     color: blackColor,
        //     font: helveticaBold
        // });

        yPosition = clientY - 30;

        // ===== PROJECT SPECIFICATIONS =====
        page.drawText('PROJECT SPECIFICATIONS', {
            x: 40,
            y: yPosition,
            size: 14,
            color: blueColor,
            font: helveticaBold
        });

        page.drawRectangle({
            x: 40,
            y: yPosition - 10,
            width: 180,
            height: 2,
            color: yellowColor,
        });

        yPosition -= 30;

        // Specification cards in a row
        const specData = [
            { label: 'HOME TYPE', value: homeType },
            { label: 'CARPET AREA', value: `${carpetArea} sq.ft.` },
            { label: 'FINISH STYLE', value: finish },
        ];

        let cardX = 40;
        const cardWidth = 160;

        specData.forEach((item) => {
            // Card background
            page.drawRectangle({
                x: cardX,
                y: yPosition - 60,
                width: cardWidth,
                height: 60,
                color: whiteColor,
                borderColor: lightGray,
                borderWidth: 1,
            });

            // Yellow top border
            page.drawRectangle({
                x: cardX,
                y: yPosition,
                width: cardWidth,
                height: 3,
                color: yellowColor,
            });

            // Label
            page.drawText(item.label, {
                x: cardX + 10,
                y: yPosition - 20,
                size: 9,
                color: darkGray,
                font: helvetica
            });

            // Value
            page.drawText(item.value, {
                x: cardX + 10,
                y: yPosition - 40,
                size: 14,
                color: blackColor,
                font: helveticaBold
            });

            cardX += cardWidth + 20;
        });

        yPosition -= 90;

        // ===== ESTIMATE SECTION =====
        page.drawText('ESTIMATE DETAILS', {
            x: 40,
            y: yPosition,
            size: 14,
            color: blueColor,
            font: helveticaBold
        });

        page.drawRectangle({
            x: 40,
            y: yPosition - 10,
            width: 130,
            height: 2,
            color: yellowColor,
        });

        yPosition -= 30;

        // Estimate card with proper height (only 60px height)
        page.drawRectangle({
            x: 40,
            y: yPosition - 60,
            width: width - 80,
            height: 60,
            color: lightGray,
        });

        // Yellow left border
        page.drawRectangle({
            x: 40,
            y: yPosition - 60,
            width: 5,
            height: 60,
            color: yellowColor,
        });

        // Total estimated value label
        page.drawText('TOTAL ESTIMATED VALUE', {
            x: 60,
            y: yPosition - 20,
            size: 11,
            color: darkGray,
            font: helvetica
        });

        // Format estimate
        const formattedEstimate = `INR ${estimate.toLocaleString('en-IN')}`;

        // Amount
        page.drawText(formattedEstimate, {
            x: 60,
            y: yPosition - 45,
            size: 24,
            color: blueColor,
            font: helveticaBold
        });

        yPosition -= 80;

        // ===== TERMS AND CONDITIONS =====
        // Separator line
        yPosition -= 10;

        page.drawLine({
            start: { x: 40, y: yPosition + 10 },
            end: { x: width - 40, y: yPosition + 10 },
            thickness: 1,
            color: lightGray,
        });

        page.drawText('Disclaimer', {
            x: 40,
            y: yPosition,
            size: 11,
            color: blueColor,
            font: helveticaBold
        });

        yPosition -= 20;

        const terms = [
            '• This is a preliminary quotation based on the information provided',
            '• Final pricing may vary after site visit and material selection',
            // '• This quotation is valid for 30 days from the issue date',
            '• For more information contact to our sales team +91 9363993814',
        ];

        terms.forEach((term) => {
            page.drawText(term, {
                x: 40,
                y: yPosition,
                size: 8,
                color: darkGray,
                font: helvetica
            });
            yPosition -= 15;
        });


        // ===== CONSULTATION MESSAGE =====
        yPosition -= 10;

        const consultationText = "Kindly have a discussion with our designers to get detailed insights.";

        const consulationTextFontSize = 15
        // calculate center position
        const textWidth = helveticaBold.widthOfTextAtSize(consultationText, consulationTextFontSize);
        const centerX = (width - textWidth) / 2;

        page.drawText(consultationText, {
            x: centerX,
            y: yPosition,
            size: consulationTextFontSize,
            color: blueColor,
            font: helveticaBold
        });

        yPosition -= 25;

        // ===== FOOTER =====
        const footerY = 50;

        page.drawLine({
            start: { x: 40, y: footerY + 10 },
            end: { x: width - 40, y: footerY + 10 },
            thickness: 1,
            color: lightGray,
        });

        // Footer with company details
        page.drawText('Vertical Living - Premium Interior Designs', {
            x: 40,
            y: footerY - 5,
            size: 8,
            color: blueColor,
            font: helvetica
        });

        page.drawText('www.theverticalliving.com', {
            x: 40,
            y: footerY - 20,
            size: 8,
            color: darkGray,
            font: helvetica
        });

        page.drawText('Contact No: +91 93639 93814', {
            x: width - 150,
            y: footerY - 5,
            size: 8,
            color: darkGray,
            font: helvetica
        });

        const pdfBytes = await pdfDoc.save();

        // 2. Upload to S3
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now();
        const filename = `${sanitizedName}_${timestamp}_Quote.pdf`;

        const fakeFile = {
            buffer: Buffer.from(pdfBytes),
            originalname: filename,
            mimetype: 'application/pdf'
        };

        const quotationData = await uploadFileToS3New(fakeFile);

        // 3. Save to MongoDB
        const newQuote = new PublicQuoteCalculatorModel({
            name, phone, location, carpetArea, homeType, finish, estimate,
            quotationPdf: quotationData, config, consent, source
        });

        await newQuote.save();

        res.status(201).json({
            ok: true,
            message: "Quotation generated and saved successfully",
            url: quotationData?.url,
            data: newQuote
        });

    } catch (error) {
        console.error("Quote Error:", error);
        res.status(500).json({ ok: false, message: "Error generating quotation" });
    }
};

export const createPublicQuoteV1 = async (req: Request, res: Response) => {
    try {
        const { name, phone, location, carpetArea, homeType, finish, estimate, config, consent, source } = req.body;

        if (!consent) {
            return res.status(400).json({ message: "consent should be true or accepted", ok: false });
        }

       
        // 1. Fetch Config & Increment Quote Counter ATOMICALLY
        const appConfig = await AppConfigModel.findOneAndUpdate(
            { configId: "global_config" },
            { $inc: { quoteCounter: 1 } }, 
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );


        const generatedQuoteRefNo = `Q-VL-${String(appConfig.quoteCounter).padStart(3, '0')}`;

        // Extract marketing text from the FIRST object in the array (with a safe fallback)
        // const generatedMarketingText = (appConfig?.marketingText && appConfig?.marketingText?.length > 0)
        //     ? appConfig?.marketingText[0]?.text
        //     : "Discount up to 50%";



        const marketingTextArray = (appConfig?.marketingText && appConfig?.marketingText.length > 0)
            ? appConfig.marketingText
            : [{ text: "Discount up to 50%" }];

        // 2. Fetch Marketing Banner Images safely
        const promoImageUrls: [string, string]  = [
            "https://i.pinimg.com/736x/58/b0/2f/58b02f052337ec088228a082d4ad3b45.jpg",
            "https://i.pinimg.com/1200x/03/6a/96/036a965f59f19b3aec0c4ac8c452424d.jpg"
        ];

        const [url1, url2] = promoImageUrls;

        
        const fetchOpts = { headers: { 'User-Agent': 'Mozilla/5.0' } };
        
        const [promoImg1Buffer, promoImg2Buffer] = await Promise.all([
            fetch(url1, fetchOpts).then(res => res.arrayBuffer()).catch(() => null),
            fetch(url2, fetchOpts).then(res => res.arrayBuffer()).catch(() => null)
        ]);

        // 1. Fetch Company Logo Buffer from URL
        let companyLogoBuffer;
        try {
            const logoRes = await fetch(COMPANY_LOGO);
            const logoArrayBuffer = await logoRes.arrayBuffer();
            companyLogoBuffer = Buffer.from(logoArrayBuffer);
        } catch (imgError) {
            console.error("Failed to load company logo for PDF", imgError);
            companyLogoBuffer = null; // Fallback to no logo if fetch fails
        }

        // 2. Extract and format products from the nested config object
        const products = [];
        if (config) {
            for (const roomKey in config) {
                const room = config[roomKey];
                for (const productKey in room.products) {
                    const prod = room.products[productKey];

                    // --- Extract dynamically from your payload or use defaults ---
                    const plyBrand = prod.plywoodBrand || "CENTURY CLUB PRIME BWP 710";
                    const innerBrand = prod.innerLaminateBrand || "VIRGO";
                    const outerBrand = prod.outerLaminateBrand || "VIRGO";
                    const uniqueFittings = prod.hardwareBrand || "Hettich/Hafele"; // Adjust to your data structure

                    const h = Number(prod.h) || 0;
                    const w = Number(prod.w) || 0;
                    const d = Number(prod.d) || 0;

                    // Build dimension string dynamically based on what exists
                    let dimParts = [];
                    if (h) dimParts.push(`${h}ft (H)`);
                    if (w) dimParts.push(`${w}ft (W)`);
                    if (d) dimParts.push(`${d}ft (D)`);
                    const dimensionText = dimParts.length > 0 ? `, precisely cut to ${dimParts.join(' x ')} specifications` : '';

                    // --- Build sentences manually (Your exact logic) ---
                    let fallbackSentences = [];

                    // Substrate
                    fallbackSentences.push(
                        plyBrand
                            ? `Primary structural fabrication utilizes ${plyBrand} substrate to ensure core dimensional stability${dimensionText}.`
                            : `Structural fabrication is executed using specified core substrates to maintain architectural integrity${dimensionText}.`
                    );

                    // Exterior & Interior
                    const innerPart = innerBrand ? ` with ${innerBrand} internal lining` : "";
                    fallbackSentences.push(
                        outerBrand
                            ? `Exterior surfaces are finished with ${outerBrand} cladding${innerPart}, applied with industrial-grade bonding for high-wear resistance.`
                            : `Surfaces involve technical cladding and lining applied to ensure durability and environmental protection.`
                    );

                    // Hardware
                    if (uniqueFittings) {
                        fallbackSentences.push(`Mechanical integration is completed using ${uniqueFittings} hardware systems, selected for operational longevity.`);
                    } else {
                        fallbackSentences.push(`The unit integrates standardized mechanical hardware systems to support essential structural load distribution.`);
                    }

                    // Final Protocol
                    fallbackSentences.push(`Final assembly follows a modular installation protocol focusing on precision edge-sealing to meet professional standards.`);

                    // Combine sentences into one cohesive paragraph
                    const finalScopeDescription = fallbackSentences.join(" ");

                    products.push({
                        // name: `${prod?.name} (${room?.roomName})`, // e.g., "TV Unit (Living Room)"
                        name: `${prod?.name}`, // e.g., "TV Unit"
                        dimensions: {
                            length: prod?.w || 0,
                            height: prod?.h || 0,
                            depth: prod?.d || 0 // Defaulting to 0 as it's missing from your JSON
                        },
                        total: prod?.total || 0, // Now capturing the exact total calculated on the frontend
                        geminiDescription: finalScopeDescription,
                        plywoodDesc: "Waterproof core, termite resistant.",
                        innerLamDesc: "0.8mm standard white finish.",
                        outerLamDesc: "1mm premium decorative finish."
                    });
                }
            }
        }

       

        // 3. Generate the PDF
        const pdfBytes = await generateQuotePDF({
            quoteNo: generatedQuoteRefNo, // Or generate dynamically
            revisionNo: 'R1',
            client: {
                name,
                phone,
                location
            },
            // marketingText: "Discount up to 50%",
            marketingText: marketingTextArray, // Injected from the array[0].text
            promoImages: {
                img1: promoImg1Buffer ? Buffer.from(promoImg1Buffer) : null,
                img2: promoImg2Buffer ? Buffer.from(promoImg2Buffer) : null
            },
            carpetArea,       // Passed for Site Context
            homeType,         // Passed for Site Context
            selectedPackage: finish,
            estimateTotal: estimate,
            products,         // The parsed products array
            companyLogoBuffer
        });


        // Upload to S3
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now();
        const filename = `${sanitizedName}_${timestamp}_Quote.pdf`;

        const fakeFile = {
            buffer: Buffer.from(pdfBytes),
            originalname: filename,
            mimetype: 'application/pdf'
        };

        const quotationData = await uploadFileToS3New(fakeFile);

        // Save to MongoDB
        const newQuote = new PublicQuoteCalculatorModel({
            name,
            phone,
            location,
            carpetArea,
            homeType,
            finish,
            estimate,
            quotationPdf: quotationData,
            config,
            consent,
            source,
            quoteRefNo: generatedQuoteRefNo // Added this field explicitly
        });

        await newQuote.save();

        console.log("newQuote ---- ", newQuote)

        res.status(201).json({
            ok: true,
            message: "Quotation generated and saved successfully",
            url: quotationData?.url,
            data: newQuote,
            appConfig
        });

    } catch (error) {
        console.error("Quote Error:", error);
        res.status(500).json({ ok: false, message: "Error generating quotation" });
    }
};




interface QuoteData {
    name: string;
    phone: string;
    location: string;
    carpetArea: number;
    homeType: string;
    finish: 'Core' | 'Prime' | 'Basic';
    estimate: number;
    quoteRefNo: string
}




// import QRCode from 'qrcode';


export const generateQuotePDF = async (quoteData: any) => {
    const {
        quoteNo,
        // revisionNo = 'R1',
        client,
        marketingText,
        promoImages,
        products,
        estimateTotal,
        selectedPackage,
        companyLogoBuffer
    } = quoteData;

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const colors = {
        primaryBlue: rgb(0.1, 0.25, 0.6),
        textDark: rgb(0.2, 0.2, 0.2),
        textLight: rgb(0.5, 0.5, 0.5),
        borderGray: rgb(0.9, 0.9, 0.9),
        bgLight: rgb(0.97, 0.97, 0.99),
        brandPillBg: rgb(0.9, 0.9, 1),
        includedBlue: rgb(0.1, 0.3, 0.8),
        excludedRed: rgb(0.8, 0.1, 0.1),
        freeGreen: rgb(0.1, 0.6, 0.2),
        termsOrange: rgb(0.9, 0.4, 0.1),
        marketingBg: rgb(0.1, 0.25, 0.6),
        marketingText: rgb(1, 0.8, 0.2)
    };

    let currentY = height - 50;
    const leftMargin = 40;
    const rightMargin = width - 40;
    const contentWidth = width - 80;

    // --- HELPER FUNCTIONS ---

    // Clean WinAnsi incompatible characters
    const sanitizeText = (txt: any) => {
        if (!txt) return '';
        // return txt.replace(/₹/g, 'Rs. ').replace(/[•◆]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
        return txt
            .toString()
            .replace(/₹/g, 'Rs. ')
            .replace(/[★◆]/g, '') // Strips out the stars and diamonds breaking WinAnsi
            .replace(/[•]/g, '-')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-'); // Fixes long dashes if they appear
    };

    const checkPageBreak = (requiredSpace: any) => {
        if (currentY - requiredSpace < 50) {
            page = pdfDoc.addPage([595.28, 841.89]);
            currentY = height - 50;
        }
    };

    const drawText = (text: any, x: any, y: any, size: any, font = fontRegular, color = colors.textDark) => {
        page.drawText(sanitizeText(text), { x, y, size, font, color });
    };

    // Text wrapper for multi-line paragraphs
    const wrapText = (text: any, maxWidth: any, font: any, fontSize: any) => {
        const words = sanitizeText(text).split(' ');
        let lines = [];
        let currentLine = '';

        words.forEach((word: any) => {
            const splitWord = word.split('\n');
            splitWord.forEach((part: any, index: number) => {
                if (index > 0) {
                    lines.push(currentLine);
                    currentLine = part + ' ';
                } else {
                    const testLine = currentLine + part + ' ';
                    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
                    if (textWidth > maxWidth && currentLine !== '') {
                        lines.push(currentLine);
                        currentLine = part + ' ';
                    } else {
                        currentLine = testLine;
                    }
                }
            });
        });
        lines.push(currentLine);
        return lines;
    };

    // const drawCard = (x: any, y: any, w: any, h: any, borderColor = colors.borderGray, bgColor = rgb(1, 1, 1)) => {
    //     page.drawRectangle({
    //         x, y: y - h, width: w, height: h,
    //         borderColor, borderWidth: 1, color: bgColor,
    //     });
    // };

    //    const drawCard = (x: any, y: any, w: any, h: any, borderColor = colors.borderGray, bgColor = rgb(1, 1, 1), isRounded = true) => {
    //         if (isRounded) {
    //             const r = 6; // Perfect smooth radius
    //             // Native SVG Path for an unbroken rounded rectangle
    //             // Note: pdf-lib automatically draws this downwards from the given Y coordinate
    //             const path = `
    //               M ${r},0
    //               L ${w - r},0
    //               Q ${w},0 ${w},${r}
    //               L ${w},${h - r}
    //               Q ${w},${h} ${w - r},${h}
    //               L ${r},${h}
    //               Q 0,${h} 0,${h - r}
    //               L 0,${r}
    //               Q 0,0 ${r},0
    //               Z
    //             `;

    //             page.drawSvgPath(path, {
    //                 x: x,
    //                 y: y - h,
    //                 color: bgColor,
    //                 borderColor: borderColor,
    //                 borderWidth: 1,
    //             });
    //         } else {
    //             // Standard sharp rectangle for inner table rows to stack seamlessly
    //             page.drawRectangle({
    //                 x: x,
    //                 y: y - h, // pdf-lib draws standard rects from the bottom up
    //                 width: w,
    //                 height: h,
    //                 color: bgColor,
    //                 borderColor: borderColor,
    //                 borderWidth: 1,
    //             });
    //         }
    //     };


    const drawCard = (x: any, y: any, w: any, h: any, borderColor = colors.borderGray, bgColor = rgb(1, 1, 1), isRounded = true) => {
        // Clean number casting WITHOUT the dangerous '||' fallbacks
        const nx = Number(x);
        const ny = Number(y);
        const nw = Number(w);
        const nh = Number(h);

        if (isRounded) {
            const r = 6;
            const path = `M ${r},0 L ${nw - r},0 Q ${nw},0 ${nw},${r} L ${nw},${nh - r} Q ${nw},${nh} ${nw - r},${nh} L ${r},${nh} Q 0,${nh} 0,${nh - r} L 0,${r} Q 0,0 ${r},0 Z`;

            page.drawSvgPath(path, {
                x: nx,
                y: ny, // CRITICAL FIX: SVG paths draw DOWNWARDS. Anchor must be exactly at the top (ny).
                color: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
            });
        } else {
            // Standard flat rectangle
            page.drawRectangle({
                x: nx,
                y: ny - nh, // Rectangles draw UPWARDS. Anchor must be exactly at the bottom (ny - nh).
                width: nw,
                height: nh,
                color: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
            });
        }
    };

    const drawSectionBox = (title: any, content: any, iconColor: any) => {
        const lines = wrapText(content, contentWidth - 40, fontRegular, 9);

        // Increased base padding to ensure the bottom border is never squeezed or hidden
        const requiredHeight = (lines.length * 14) + 75;

        checkPageBreak(requiredHeight);

        // Title with small circular marker
        page.drawCircle({ x: leftMargin + 5, y: currentY - 5, size: 3, color: iconColor });
        drawText(title.toUpperCase(), leftMargin + 15, currentY - 9, 10, fontBold, iconColor);
        currentY -= 25;

        // Draws the flawless rounded box using the SVG path logic above
        drawCard(leftMargin, currentY, contentWidth, requiredHeight - 35, iconColor, rgb(1, 1, 1), true);

        let textY = currentY - 20;
        lines.forEach(line => {
            if (line.trim() !== '') {
                drawText(line, leftMargin + 15, textY, 9, fontRegular, colors.textDark);
            }
            textY -= 14;
        });

        // Safely move cursor below the new padded box
        currentY -= (requiredHeight - 15);
    };


    // Helper to draw a sleek, custom lock icon using native shapes
    // Helper to draw a sleek, custom lock icon using native shapes
    const drawLockIcon = (cx: any, cy: any, color: any) => {
        // 1. Shackle (The top loop) - Drawn with a white center to mask the background
        page.drawCircle({
            x: cx,
            y: cy + 4,
            size: 5,
            borderColor: color,
            borderWidth: 2,
            color: rgb(1, 1, 1)
        });

        // 2. Lock Body (Covers the bottom half of the shackle)
        page.drawRectangle({
            x: cx - 8,
            y: cy - 6,
            width: 16,
            height: 12,
            color: color
        });

        // 3. Keyhole (White circle + small line)
        page.drawCircle({ x: cx, y: cy, size: 1.5, color: rgb(1, 1, 1) });
        page.drawLine({
            start: { x: cx, y: cy },
            end: { x: cx, y: cy - 3 },
            thickness: 1.5,
            color: rgb(1, 1, 1)
        });
    };

    const embedSafeImage = async (imgBuffer: Buffer) => {
        if (!imgBuffer || imgBuffer.length < 2) return null;
        try {
            if (imgBuffer[0] === 0x89 && imgBuffer[1] === 0x50) return await pdfDoc.embedPng(imgBuffer);
            else if (imgBuffer[0] === 0xFF && imgBuffer[1] === 0xD8) return await pdfDoc.embedJpg(imgBuffer);
            return null;
        } catch (err) { return null; }
    };

    // --- 1. HEADER SECTION ---
    // if (companyLogoBuffer) {
    //     const logoImage = await pdfDoc.embedPng(companyLogoBuffer);
    //     page.drawImage(logoImage, { x: leftMargin, y: currentY - 50, width: 60, height: 60 });
    // }

    // --- 1. HEADER SECTION ---

    const now = new Date();
    const issuedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const issuedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let logoImage: any;
    if (companyLogoBuffer) {
        try {
            // Check the first two bytes of the buffer to detect if it's a PNG
            if (companyLogoBuffer[0] === 0x89 && companyLogoBuffer[1] === 0x50) {
                logoImage = await pdfDoc.embedPng(companyLogoBuffer);
            } else {
                // If it's not a PNG, assume it is a JPEG
                logoImage = await pdfDoc.embedJpg(companyLogoBuffer);
            }

            page.drawImage(logoImage, { x: leftMargin, y: currentY - 50, width: 60, height: 60 });
        } catch (err) {
            console.error("Failed to embed logo into PDF:", err);
            // Fails gracefully so the rest of the PDF still generates
        }
    }


    drawText('VERTICAL LIVING', 120, currentY - 15, 22, fontBold, colors.primaryBlue);
    drawText('PREMIUM INTERIOR DESIGN & MODULAR EXECUTION', 120, currentY - 30, 9, fontBold, colors.termsOrange);
    // Dynamic Date & Time Rows
    const metaXLabel = 400;
    const metaXValue = 490;

    // drawText('QUOTE REF NO:', 400, currentY - 10, 9, fontBold, colors.textLight);
    // drawText(quoteNo, 490, currentY - 10, 10, fontBold, colors.primaryBlue);


    drawText('QUOTE REF NO:', metaXLabel, currentY - 10, 9, fontBold, colors.textLight);
    drawText(quoteNo, metaXValue, currentY - 10, 10, fontBold, colors.primaryBlue);

    drawText('ISSUED ON:', metaXLabel, currentY - 25, 9, fontBold, colors.textLight);
    drawText(issuedDate, metaXValue, currentY - 25, 10, fontRegular, colors.textDark);

    drawText('TIMESTAMP:', metaXLabel, currentY - 40, 9, fontBold, colors.textLight);
    drawText(issuedTime, metaXValue, currentY - 40, 10, fontRegular, colors.textDark);
    //   drawText('REVISION NO:', 400, currentY - 25, 9, fontBold, colors.textLight);
    //   drawText(revisionNo, 490, currentY - 25, 10, fontRegular, colors.textDark);

    currentY -= 70;
    page.drawLine({ start: { x: leftMargin, y: currentY }, end: { x: rightMargin, y: currentY }, thickness: 2, color: colors.primaryBlue });
    currentY -= 30;

    // --- 2. ENTITY / CONTACT / TAX CARDS ---
    const topCardWidth = (contentWidth - 20) / 3;

    drawCard(leftMargin, currentY, topCardWidth, 70);
    drawText('REGISTERED ENTITY', leftMargin + 10, currentY - 20, 9, fontBold, colors.primaryBlue);
    drawText('RAMS TECH CIRCLE (OPC) PVT LTD', leftMargin + 10, currentY - 35, 8, fontBold);
    drawText('No-22, 13th Main Road, Anna Nagar', leftMargin + 10, currentY - 47, 8, fontRegular);

    drawCard(leftMargin + topCardWidth + 10, currentY, topCardWidth, 70);
    drawText('CONTACT DETAILS', leftMargin + topCardWidth + 20, currentY - 20, 9, fontBold, colors.termsOrange);
    drawText('9363993814', leftMargin + topCardWidth + 20, currentY - 35, 8, fontRegular);
    drawText('info@theverticalliving.com', leftMargin + topCardWidth + 20, currentY - 47, 8, fontRegular);

    drawCard(leftMargin + (topCardWidth * 2) + 20, currentY, topCardWidth, 70);
    drawText('TAX REGISTRATION', leftMargin + (topCardWidth * 2) + 30, currentY - 20, 9, fontBold, colors.textDark);
    drawText('GSTIN: 33AANCR2813E1ZM', leftMargin + (topCardWidth * 2) + 30, currentY - 35, 8, fontBold);
    drawText('Status: Active', leftMargin + (topCardWidth * 2) + 30, currentY - 47, 8, fontRegular, colors.freeGreen);

    currentY -= 90;

    // --- 3. CLIENT INFO & SITE CONTEXT ---
    const midCardWidth = (contentWidth - 10) / 2;

    drawCard(leftMargin, currentY, midCardWidth, 80);
    drawText('CLIENT INFO', leftMargin + 10, currentY - 20, 10, fontBold, colors.primaryBlue);
    drawText(`Client Name: ${client.name}`, leftMargin + 10, currentY - 35, 9, fontRegular);
    drawText(`WhatsApp: ${client.phone}`, leftMargin + 10, currentY - 50, 9, fontRegular);
    drawText(`Email: ${client.email || 'Not Entered Yet'}`, leftMargin + 10, currentY - 65, 9, fontRegular);

    drawCard(leftMargin + midCardWidth + 10, currentY, midCardWidth, 80);
    drawText('SITE CONTEXT', leftMargin + midCardWidth + 20, currentY - 20, 10, fontBold, rgb(0.6, 0.2, 0.1));
    drawText(`Location: ${client.location}`, leftMargin + midCardWidth + 20, currentY - 35, 9, fontRegular);

    // ADDED: Home Type and Carpet Area
    const areaText = quoteData.carpetArea ? `${quoteData.carpetArea} Sq.Ft` : 'TBD';
    const typeText = quoteData.homeType ? quoteData.homeType : 'TBD';
    drawText(`Configuration: ${typeText} | Area: ${areaText}`, leftMargin + midCardWidth + 20, currentY - 50, 9, fontRegular);

    drawText(`Quote Ref: ${quoteNo}`, leftMargin + midCardWidth + 20, currentY - 65, 9, fontRegular);

    currentY -= 110;

    // --- 4. TERMS, INCLUSIONS, EXCLUSIONS SECTIONS ---

    const whatsIncluded = `
- Modular Furniture (As per Approved Design)  
  Supply and installation of modular furniture strictly as per the final approved designs, layouts, dimensions, and specifications.

- Materials & Hardware (As Specified in the Quote)  
  Quality raw materials including boards/plywood, laminates/finishes, and premium hardware as mentioned in this quotation by brand, model, thickness, and finish.  
  Any upgrades or changes can be accommodated with a revised quote after your approval.

- Factory Finish & Edge Banding (2mm Standard Finish)  
  Professional factory finish with 2mm edge banding as part of the standard manufacturing process for the selected materials and finishes.
`;

    const whatsNotIncluded = `
- Electrical, Plumbing, Painting & Civil Works (Unless Specifically Quoted)  
  Electrical works, plumbing works, painting, wall cutting/chasing, patchwork, plastering, and any other civil modifications are not included unless specifically mentioned.

- Appliances, Lights & Loose Accessories  
  Appliances, lights, fixtures, decorative fittings, and loose accessories are not included unless explicitly specified.

- Debris Removal, Permissions & Third-Party Charges  
  Debris removal, waste disposal, building permissions, society or association charges, parking or loading fees are not included.
`;

    const whatIsFree = `Complimentary (Applicable for projects above Rs. 5,00,000):
    - Electrical labour for open-wall wiring only
    - Excludes wall cutting/chasing, plastering, patchwork, painting
    - Excludes all electrical materials and accessories
    - Subject to Complimentary Terms mentioned in Disclaimer`;

    const termsText = `VERTICAL LIVING – PAYMENT TERMS
------------------------------------------------------------
MILESTONE | AMOUNT | WORK INCLUDED
- Booking Advance: INR 10,000 (fixed) (Site visit, discussion, proposal)
- Design Approval: INR 15,000 (fixed) (2D/3D design, site measurement, BOQ)
- Procurement: 80% of total (Material purchase, fabrication initiation)
- Execution: 10% of total (Installation, finishing, electrical/plumbing)
- Handover: 10% of total (Snag closure, cleaning, final handover)

PAYMENT TERMS AND CONDITIONS
------------------------------------------------------------
- Delayed Payments: Interest of 2% per month applies after 5 working days.
- GST: Added as applicable by law.
- Forfeiture Clause: If next milestone is not paid within 7 days, previous fixed payments are forfeited.
- Legal Validity: Acceptance via digital/physical signature or email is enforceable under the IT Act, 2000.`;

    const disclaimer = `DISCLAIMER, PRELIMINARY ESTIMATE & CHANGE CONTROL
------------------------------------------------------------
1. PURPOSE OF PRELIMINARY QUOTES: Any rough estimate or sqft-based pricing is shared solely to help the Client assess budget feasibility. 
2. INDICATIVE NATURE OF QUOTES: Rates shared without complete inputs are only indicative and not binding. 
3. DESIGN FINALITY: All dimensions, finishes, and specifications are based on details approved at the time of quotation.
4. SCOPE BOUNDARIES: Covers only explicitly mentioned items.
5. MATERIAL & PRICE FLUCTUATIONS: Materials are subject to market availability. 
6. TIMELINE DEPENDENCIES: Estimates depend on timely approvals and site readiness. 
7. CLIENT APPROVALS: Approvals given via email, WhatsApp, or signature are final. 
8. SITE CONDITIONS: Quotation is based on visible conditions. 
9. NO COMMITMENT: No price or timeline is locked until a detailed final quotation is formally approved.
10. NO VERBAL COMMITMENTS: Only specifications recorded in writing within this document shall be binding.
11. FORCE MAJEURE: The Company is not liable for delays caused by strikes, lockdowns, transport disruptions, or natural calamities.

------------------------------------------------------------------------------------------------------------------------

Complimentary Electrical Labour (Applicable for Projects Above ₹5,00,000)

• Complimentary electrical labour is provided only for open-wall wiring within the approved interior work scope.
• This complimentary service covers labour charges only and does not include any electrical materials or accessories such as wires, conduits, switches, sockets, switchboards, MCBs, DBs, fittings, lights, fans, or fixtures.
• Wall cutting, wall chasing, wall breaking, plastering, patchwork, painting, finishing, or restoration work is strictly excluded and will be charged separately if required.
• Complimentary electrical labour applies only to new wiring in open walls and excludes rewiring of existing concealed wiring, fault finding, rectification, shifting of main lines, or modifications to existing electrical infrastructure unless expressly quoted.
• Any additional electrical points, layout changes, or work beyond the approved electrical layout shall be chargeable.
• Complimentary electrical labour is applicable only if the final approved and executed project value exceeds ₹5,00,000. If the project value is revised below this threshold due to scope reduction, cancellation, or client-driven changes, the Company reserves the right to withdraw this benefit.
• Approvals, permits, inspections, and coordination with building management or authorities are not included and remain the Client’s responsibility unless separately quoted.
• This complimentary service does not extend the project delivery timeline. Delays due to material availability, client approvals, or site readiness shall not be attributed to the Company.
• Complimentary electrical labour is provided at the Company’s discretion, may be modified or withdrawn in case of payment delays, scope changes, site constraints, or non-compliance with payment terms, and is not a contractual entitlement.
`;

    drawSectionBox('WHAT IS INCLUDED', whatsIncluded, colors.includedBlue);
    drawSectionBox('WHAT IS EXCLUDED', whatsNotIncluded, colors.excludedRed);
    drawSectionBox('WHAT IS FREE', whatIsFree, colors.freeGreen);
    drawSectionBox('TERMS & CONDITIONS', termsText, colors.termsOrange);
    drawSectionBox('PROJECT DISCLAIMER', disclaimer, colors.textDark);

    // --- 5. ATTRACTIVE MARKETING BANNER ---


    // // Helper to draw a clean, vector Gift Box icon using safe primitives
    // const drawGiftIcon = (cx: any, cy: any, boxColor: any, ribbonColor: any) => {
    //     // Base of the box
    //     page.drawRectangle({ x: cx - 10, y: cy - 14, width: 20, height: 14, color: boxColor });
    //     // Box Lid
    //     page.drawRectangle({ x: cx - 12, y: cy, width: 24, height: 5, color: boxColor });

    //     // Vertical Ribbon
    //     page.drawRectangle({ x: cx - 2.5, y: cy - 14, width: 5, height: 19, color: ribbonColor });
    //     // Horizontal Ribbon on base
    //     page.drawRectangle({ x: cx - 10, y: cy - 7, width: 20, height: 3, color: ribbonColor });

    //     // The Bow (Two little angled lines on top)
    //     page.drawLine({ start: { x: cx, y: cy + 5 }, end: { x: cx - 6, y: cy + 10 }, thickness: 2, color: ribbonColor });
    //     page.drawLine({ start: { x: cx, y: cy + 5 }, end: { x: cx + 6, y: cy + 10 }, thickness: 2, color: ribbonColor });
    // };


    // // ==========================================
    // // --- EXCLUSIVE MARKETING BANNER ---
    // // ==========================================
    // const bannerHeight = 85;
    // checkPageBreak(bannerHeight + 40);

    // // Provide a fallback just in case the dynamic text is missing
    // const dynamicOfferText = quoteData.marketingText || "Special Factory Discount";

    // // 1. Draw Outer Premium Dark Box (Solid Blue Background)
    // drawCard(leftMargin, currentY, contentWidth, bannerHeight, colors.primaryBlue, colors.primaryBlue, true);

    // // 2. Draw an inner Orange "Ticket/Badge" on the left side
    // const badgeWidth = 140;
    // drawCard(leftMargin + 10, currentY - 10, badgeWidth, bannerHeight - 20, colors.termsOrange, colors.termsOrange, true);

    // // Calculate Centers for the Orange Badge
    // const badgeCenterX = leftMargin + 10 + (badgeWidth / 2);

    // // Draw the Custom Vector Gift Icon inside the badge
    // drawGiftIcon(badgeCenterX, currentY - 30, rgb(1, 1, 1), colors.primaryBlue);

    // // Draw the dynamic marketing text centered below the icon
    // const offerTextWidth = fontBold.widthOfTextAtSize(dynamicOfferText.toUpperCase(), 10);
    // drawText(dynamicOfferText.toUpperCase(), badgeCenterX - (offerTextWidth / 2), currentY - 58, 10, fontBold, rgb(1, 1, 1));

    // // 3. Marketing Copy on the Right (Value & Urgency - No hidden fees implied)
    // const textStartX = leftMargin + badgeWidth + 25;

    // // Headline
    // drawText('CLAIM YOUR VIP FACTORY SAVINGS', textStartX, currentY - 25, 11, fontBold, rgb(1, 1, 1));

    // // Subtext (Positive framing: direct savings + free stuff)
    // drawText('We have applied exclusive direct-to-buyer pricing to this estimate.', textStartX, currentY - 45, 9, fontRegular, rgb(0.85, 0.85, 0.85));
    // drawText('Speak with our team today to lock in your custom discount and', textStartX, currentY - 58, 9, fontRegular, rgb(0.85, 0.85, 0.85));
    // drawText('claim complimentary premium hardware upgrades on us.', textStartX, currentY - 71, 9, fontRegular, rgb(0.85, 0.85, 0.85));

    // currentY -= (bannerHeight + 30);


   // ==========================================
    // --- EXCLUSIVE MARKETING BANNERS ---
    // ==========================================
    
    // Safely embed the background images
    let bgImg1, bgImg2;
    if (promoImages?.img1) bgImg1 = await embedSafeImage(promoImages.img1);
    if (promoImages?.img2) bgImg2 = await embedSafeImage(promoImages.img2);
    
    const bannerImgs = [bgImg1, bgImg2];
    const bannerHeight = 330; 

    if (marketingText && Array.isArray(marketingText)) {
        marketingText.forEach((promo, index) => {
            checkPageBreak(bannerHeight + 40);
            
            const currentImg = bannerImgs[index] || null; 
            
            // 1. Draw the massive image background
            if (currentImg) {
                page.drawImage(currentImg, {
                    x: leftMargin,
                    y: currentY - bannerHeight,
                    width: contentWidth,
                    height: bannerHeight
                });
            } else {
                drawCard(leftMargin, currentY, contentWidth, bannerHeight, colors.primaryBlue, colors.primaryBlue, false);
            }

            // 2. ENGINEER A FLAWLESS, SEAMLESS LINEAR GRADIENT
            // The "Stacking Method": 150 overlapping rectangles with tiny opacity.
            // This completely eliminates the "stripes" caused by PDF viewer anti-aliasing.
            const steps = 150;
            const rightEdge = leftMargin + contentWidth;
            const gradientStartX = leftMargin; // Start the fade softly from the far left edge
            const gradientWidth = contentWidth; 
            
            for (let i = 0; i < steps; i++) {
                const currentX = gradientStartX + ((i / steps) * gradientWidth);
                const rectWidth = rightEdge - currentX;
                
                // Draw rectangles that all snap to the right edge.
                page.drawRectangle({
                    x: currentX,
                    y: currentY - bannerHeight,
                    width: rectWidth,
                    height: bannerHeight,
                    color: rgb(0, 0, 0),
                    // Microscopic opacity. Stacked 150 times, it smoothly reaches ~90% darkness on the right
                    opacity: 0.015 
                });
            }

            // 3. Draw the Orange Accent Line exactly where the text begins
            const textZoneStartX = leftMargin + (contentWidth * 0.40); // 40% in from the left
            page.drawLine({
                start: { x: textZoneStartX, y: currentY },
                end: { x: textZoneStartX, y: currentY - bannerHeight },
                thickness: 4,
                color: colors.termsOrange
            });

            // 4. Write the Marketing Text
            const maxTextWidth = contentWidth * 0.55; 
            const textLines = wrapText(promo.text, maxTextWidth, fontBold, 22);
            
            // Center the text vertically within this massive 330px block
            let textY = currentY - (bannerHeight / 2) + ((textLines.length * 30) / 2) - 10;
            
            drawText('EXCLUSIVE OFFER', textZoneStartX + 30, textY + 35, 11, fontBold, colors.termsOrange);

            textLines.forEach((line: string) => {
                drawText(line, textZoneStartX + 30, textY, 22, fontBold, rgb(1, 1, 1));
                textY -= 30; 
            });

            currentY -= (bannerHeight + 40); 
        });
    }


    // ==========================================
    // --- 4. EXECUTION SCOPE (NEW PAGE) ---
    // ==========================================
    
    // FORCE A BRAND NEW PAGE for the execution scope
    page = pdfDoc.addPage([595.28, 841.89]);
    currentY = height - 50;


    // --- 6. EXECUTION SCOPE & PRODUCTS ---
    // checkPageBreak(100);
    drawText('Execution Scope & Product Estimates', leftMargin, currentY, 14, fontBold, colors.primaryBlue);
    page.drawLine({ start: { x: leftMargin, y: currentY - 8 }, end: { x: rightMargin, y: currentY - 8 }, thickness: 2, color: colors.primaryBlue });
    currentY -= 35;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];

        if (i < 2) {
            const scopeLines = wrapText(product.geminiDescription, contentWidth - 40, fontRegular, 9);
            // 65 (header) + 35 (scope text) + 130 (materials table) + 140 (cost table) + padding
            // const containerHeight = 65 + (scopeLines.length * 12) + 35 + 130 + 140;
            const containerHeight = 440 + (scopeLines.length * 12);

            checkPageBreak(containerHeight + 40);

            // 2. Draw Outer Container (Rounded Border)
            drawCard(leftMargin, currentY, contentWidth, containerHeight, colors.borderGray, rgb(1, 1, 1));

            // 3. Draw Thick Blue Accent Line on the Left Edge
            page.drawLine({
                start: { x: leftMargin, y: currentY - 8 },
                end: { x: leftMargin, y: currentY - containerHeight + 8 },
                thickness: 4,
                color: colors.primaryBlue
            });

            // Define inner margin to push text away from the left blue line
            const innerLeft = leftMargin + 15;
            let sectionY = currentY - 20;

            // 4. Product Header (Left Side)
            drawText(`${i + 1}. Product: ${product.name}`, innerLeft, sectionY, 12, fontBold, colors.primaryBlue);
            drawText(`Product Total: Rs. ${product.total}`, innerLeft, sectionY - 20, 12, fontBold, colors.freeGreen);

            // 5. Technical Dimensions (Right Side)
            const dimBoxWidth = 220;
            const dimBoxX = rightMargin - dimBoxWidth - 10;
            drawCard(dimBoxX, sectionY + 5, dimBoxWidth, 45, colors.borderGray, colors.bgLight);
            drawText('TECHNICAL DIMENSIONS', dimBoxX + 10, sectionY - 10, 8, fontBold, colors.textLight);
            drawText(`L: ${product.dimensions.length} ft   x   H: ${product.dimensions.height} ft   x   D: ${product.dimensions.depth} ft`, dimBoxX + 10, sectionY - 28, 10, fontBold, colors.primaryBlue);

            sectionY -= 65;

            // 6. Execution Scope
            drawText('Execution Scope of Work', innerLeft, sectionY, 10, fontBold, colors.textDark);
            sectionY -= 15;
            scopeLines.forEach((line: any) => {
                drawText(line, innerLeft, sectionY, 9, fontRegular, colors.textLight);
                sectionY -= 12;
            });
            sectionY -= 20;

            // 7. MATERIAL & BRAND SPECIFICATIONS TABLE
            drawText('Material & Brand Specifications', innerLeft, sectionY, 10, fontBold, colors.primaryBlue);
            sectionY -= 15;

            const tableWidth = contentWidth - 30;
            drawCard(innerLeft, sectionY, tableWidth, 25, colors.borderGray, colors.bgLight, false);
            drawText('Category', innerLeft + 10, sectionY - 16, 9, fontBold, colors.primaryBlue);
            drawText('Brand', innerLeft + 150, sectionY - 16, 9, fontBold, colors.primaryBlue);
            drawText('Description', innerLeft + 350, sectionY - 16, 9, fontBold, colors.primaryBlue);
            sectionY -= 25;

            // const materials = [
            //     { cat: 'Plywood', brand: 'CENTURY CLUB PRIME BWP 710', desc: product.plywoodDesc || '' },
            //     { cat: 'Inner Laminate', brand: 'VIRGO', desc: product.innerLamDesc || '' },
            //     { cat: 'Outer Laminate', brand: 'VIRGO', desc: product.outerLamDesc || '' }
            // ];

            const materials = [
                { cat: 'Plywood', brand: product.plywoodBrand || 'CENTURY CLUB PRIME BWP 710', desc: product.plywoodDesc || '' },
                { cat: 'Inner Laminate', brand: product.innerLaminateBrand || 'VIRGO', desc: product.innerLamDesc || '' },
                { cat: 'Outer Laminate', brand: product.outerLaminateBrand || 'VIRGO', desc: product.outerLamDesc || '' }
            ];

            materials.forEach((mat) => {
                drawCard(innerLeft, sectionY, tableWidth, 30, colors.borderGray, rgb(1, 1, 1), false);
                drawText(mat.cat, innerLeft + 10, sectionY - 18, 9, fontBold, colors.textDark);

                const brandWidth = fontBold.widthOfTextAtSize(mat.brand, 8) + 10;
                page.drawRectangle({ x: innerLeft + 148, y: sectionY - 22, width: brandWidth, height: 14, color: colors.brandPillBg });
                drawText(mat.brand, innerLeft + 153, sectionY - 18, 8, fontBold, colors.primaryBlue);

                drawText(mat.desc.substring(0, 40), innerLeft + 350, sectionY - 18, 8, fontRegular, colors.textLight);
                sectionY -= 30;
            });
            sectionY -= 20;

            // 8. COST BREAK-UP TABLE
            drawText('Cost Break-Up', innerLeft, sectionY, 10, fontBold, colors.primaryBlue);
            sectionY -= 15;

            drawCard(innerLeft, sectionY, tableWidth, 25, colors.borderGray, colors.bgLight, false);
            drawText('Description', innerLeft + 10, sectionY - 16, 9, fontBold, colors.primaryBlue);
            drawText('Amount (Rs.)', rightMargin - 90, sectionY - 16, 9, fontBold, colors.primaryBlue);
            sectionY -= 25;

            const costs = [
                { desc: 'Core Materials (Plywood & Laminates)', amt: product.total },
                { desc: 'Fittings & Accessories', amt: '0' },
                { desc: 'Adhesives & Glues', amt: '0' },
                { desc: 'Non-Branded Materials', amt: '0' }
            ];

            costs.forEach((c) => {
                drawCard(innerLeft, sectionY, tableWidth, 25, colors.borderGray, rgb(1, 1, 1), false);
                drawText(c.desc, innerLeft + 10, sectionY - 16, 9, fontRegular, colors.textDark);

                const amtString = `Rs. ${c.amt}`;
                const amtWidth = fontBold.widthOfTextAtSize(amtString, 9);
                drawText(amtString, rightMargin - 30 - amtWidth, sectionY - 16, 9, fontBold, colors.textDark);

                sectionY -= 25;
            });

            // 9. Update currentY past the whole drawn container block
            currentY -= (containerHeight + 30);

        } else {
          
            const containerHeight = 190; // Increased height to comfortably fit all skeleton content
            checkPageBreak(containerHeight + 40);

            // 1. Draw Outer Container (Faint background to indicate disabled state)
            drawCard(leftMargin, currentY, contentWidth, containerHeight, colors.borderGray, rgb(0.97, 0.97, 0.97), true);

            // Gray left border accent to indicate it is inactive/locked
            page.drawLine({
                start: { x: leftMargin, y: currentY - 8 },
                end: { x: leftMargin, y: currentY - containerHeight + 8 },
                thickness: 4,
                color: rgb(0.8, 0.8, 0.8) // Softer gray
            });

            const innerLeft = leftMargin + 15;
            let sectionY = currentY - 20;

            // 2. Product Header (Visible Name, Masked Total)
            drawText(`${i + 1}. Product: ${product.name}`, innerLeft, sectionY, 12, fontBold, colors.textLight);
            drawText(`Product Total: Rs. XX,XXX`, innerLeft, sectionY - 20, 12, fontBold, colors.textLight);

            // 3. Skeleton: Technical Dimensions (Right Side)
            const dimBoxWidth = 220;
            const dimBoxX = rightMargin - dimBoxWidth - 10;
            drawCard(dimBoxX, sectionY + 5, dimBoxWidth, 45, colors.borderGray, rgb(0.94, 0.94, 0.94), true);
            drawText('TECHNICAL DIMENSIONS', dimBoxX + 10, sectionY - 10, 8, fontBold, colors.textLight);
            // Masked dimensions
            drawText(`L: X ft   x   H: X ft   x   D: X ft`, dimBoxX + 10, sectionY - 28, 10, fontBold, colors.textLight);

            sectionY -= 65;

            // 4. Skeleton: Execution Scope
            const skeletonColor = rgb(0.9, 0.9, 0.9); // Lighter gray for a softer UI fade effect

            drawText('Execution Scope of Work', innerLeft, sectionY, 10, fontBold, colors.textLight);
            sectionY -= 15;

            // Draw gray placeholder bars instead of text
            page.drawRectangle({ x: innerLeft, y: sectionY - 5, width: contentWidth - 60, height: 8, color: skeletonColor });
            page.drawRectangle({ x: innerLeft, y: sectionY - 20, width: contentWidth - 120, height: 8, color: skeletonColor });

            sectionY -= 40;

            // 5. Skeleton: Material Specifications
            drawText('Material & Brand Specifications', innerLeft, sectionY, 10, fontBold, colors.textLight);
            sectionY -= 15;
            // A taller block to mimic a faded table structure
            page.drawRectangle({ x: innerLeft, y: sectionY - 25, width: contentWidth - 30, height: 30, color: skeletonColor });

            // ==========================================
            // --- THE OVERLAY BANNER ---
            // ==========================================
            const bannerHeight = 56;
            const overlayY = currentY - (containerHeight / 2) + (bannerHeight / 2);

            // Draw a white strip across the middle to hold the call to action
            page.drawRectangle({
                x: leftMargin + 2,
                y: overlayY - bannerHeight,
                width: contentWidth - 4,
                height: bannerHeight,
                color: rgb(1, 1, 1),
                borderColor: colors.borderGray,
                borderWidth: 1
            });

            // Calculate exact centers using the font widths to ensure flawless symmetry
            const centerOfPage = width / 2;
            const lockText = 'PREMIUM DETAILS LOCKED';
            const subText = 'Contact sales to reveal full material specs, and pricing.';

            const lockTextWidth = fontBold.widthOfTextAtSize(lockText, 11);
            const subTextWidth = fontRegular.widthOfTextAtSize(subText, 9);

            // Group the icon and title together, then center the group
            const iconOffset = 22;
            const totalTitleWidth = lockTextWidth + iconOffset;
            const titleStartX = centerOfPage - (totalTitleWidth / 2);

            // Draw the custom lock icon and text perfectly centered
            drawLockIcon(titleStartX + 5, overlayY - 20, colors.primaryBlue);
            drawText(lockText, titleStartX + iconOffset, overlayY - 24, 11, fontBold, colors.primaryBlue);
            drawText(subText, centerOfPage - (subTextWidth / 2), overlayY - 40, 9, fontRegular, colors.textDark);

            // Move Y cursor down past this entire block
            currentY -= (containerHeight + 30);
        }
    }

    // --- 7. TOTALS & FOOTER ---



    // Helper to create clickable URI links in the PDF
    const drawClickableLink = (text: any, url: any, x: any, y: any, size: any, font = fontRegular, color = colors.primaryBlue) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        drawText(text, x, y, size, font, color);

        // Create PDF Link Annotation Dictionary
        const link = pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [x, y - 2, x + textWidth, y + size], // Clickable area coordinates
            Border: [0, 0, 0],
            A: {
                Type: 'Action',
                S: 'URI',
                URI: PDFString.of(url),
            },
        });

        // Inject the link into the page's annotations array
        const annots = page.node.lookup(PDFName.of('Annots'), PDFArray);
        if (annots) {
            annots.push(link);
        } else {
            page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([link]));
        }
    };


    checkPageBreak(150);
    currentY -= 20;

    // 1. GRAND TOTAL BOX
    const totalBoxHeight = 70;

    // Format number to Indian format WITH paise (e.g. 1,50,00,000.00)
    const formattedTotal = Number(estimateTotal).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const totalString = `INR ${formattedTotal}`;

    // Calculate Validity Date dynamically (14 days from execution)
    const today = new Date();
    const validityDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const validUntilStr = validityDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Draw a prominent rounded box for the total
    drawCard(leftMargin, currentY, contentWidth, totalBoxHeight, colors.primaryBlue, colors.bgLight, true);

    // Left side of the box: Heading and Validity Note
    drawText('TOTAL ESTIMATE VALUE', leftMargin + 20, currentY - 25, 12, fontBold, colors.primaryBlue);
    drawText(`Valid until: ${validUntilStr}`, leftMargin + 20, currentY - 45, 9, fontRegular, colors.textLight);

    // Right side of the box: Prominent Amount
    const totalFontSize = 18;
    const totalWidth = fontBold.widthOfTextAtSize(totalString, totalFontSize);
    drawText(totalString, rightMargin - 20 - totalWidth, currentY - 35, totalFontSize, fontBold, colors.primaryBlue);

    currentY -= (totalBoxHeight + 30);


    // ==========================================
    // --- IMPORTANT NOTES (INFO BOX) ---
    // ==========================================
    const notesHeight = 100;
    checkPageBreak(notesHeight + 40);

    // Draw a subtle background box for the notes
    drawCard(leftMargin, currentY, contentWidth, notesHeight, colors.borderGray, rgb(0.98, 0.98, 0.98), true);

    const notesLeft = leftMargin + 15;
    let noteY = currentY - 20;

    // Custom 'Info' Icon (Blue circle with a white 'i')
    page.drawCircle({ x: notesLeft + 6, y: noteY + 4, size: 7, color: colors.primaryBlue });
    drawText('i', notesLeft + 4.5, noteY, 9, fontBold, rgb(1, 1, 1));

    // Heading
    drawText('IMPORTANT NOTES', notesLeft + 20, noteY, 10, fontBold, colors.primaryBlue);
    noteY -= 20;

    // The notes (hyphens used instead of em-dashes to strictly prevent WinAnsi errors)
    const importantNotes = [
        "This is a preliminary estimate. Final pricing confirmed after site visit.",
        "Rates apply to modular works only - civil, electrical & painting excluded.",
        "Material upgrades or scope changes will revise the estimate accordingly.",
        "To lock this price, book your consultation before the validity date."
    ];

    importantNotes.forEach(note => {
        // Draw a completely safe vector dot for the bullet point
        page.drawCircle({ x: notesLeft + 6, y: noteY + 3, size: 2, color: colors.termsOrange });
        drawText(note, notesLeft + 15, noteY, 9, fontRegular, colors.textDark);
        noteY -= 14; // Spacing between lines
    });

    currentY -= (notesHeight + 30); // Move cursor down past the notes box



    // 2. SELECTED PACKAGE & FEATURES

    checkPageBreak(160);

    drawText(`Selected Package: ${selectedPackage}`, leftMargin, currentY, 12, fontBold, colors.termsOrange);
    currentY -= 25;

    // Features transcribed exactly from your image
    const packageFeatures = [
        "BWR Plywood carcass (IS:710 grade)",
        "Good quality granite / basic quartz top",
        "1mm High-Pressure Laminate finish",
        "Bottle pull-out, cutlery tray & basket",
        "2mm PVC edge banding throughout",
        "Basic locker shelf in wardrobe",
        "Hettich soft-close concealed hinges",
        "Factory finish + site installation",
        "Hettich Quadro undermount channels",
        "Greenlam / CenturyLaminates shutter",
        "Hettich TopLine sliding wardrobe system",
        "3-year workmanship warranty"
    ];

    // Draw features in 2 neat columns with custom drawn circles (100% safe from WinAnsi errors)
    const col1X = leftMargin + 15;
    const col2X = leftMargin + (contentWidth / 2) + 15;
    let featureY = currentY;

    for (let i = 0; i < packageFeatures.length; i += 2) {
        // Left Column Item
        if (packageFeatures[i]) {
            page.drawCircle({ x: col1X - 8, y: featureY + 3, size: 2.5, color: colors.termsOrange });
            drawText(packageFeatures[i], col1X, featureY, 9, fontRegular, colors.textDark);
        }
        // Right Column Item
        if (packageFeatures[i + 1]) {
            page.drawCircle({ x: col2X - 8, y: featureY + 3, size: 2.5, color: colors.termsOrange });
            drawText(packageFeatures[i + 1], col2X, featureY, 9, fontRegular, colors.textDark);
        }
        featureY -= 20; // Line spacing
    }

    currentY = featureY - 15;

    // System constraints note
    // drawText('Note: Permitted uploads for execution include PDFs, Images, and Videos only.', leftMargin, currentY, 8, fontRegular, colors.textLight);


    // ==========================================
    // --- 6. OUR WORKS (PORTFOLIO) ---
    // ==========================================

    // 1. High-Quality Placeholder Links (Forced to JPG to prevent pdf-lib crashes)
    const portfolioUrls = [
        { title: "Modular Kitchen", url: "https://i.pinimg.com/736x/4e/16/6e/4e166e19806386b87672363d32c9ad20.jpg" },
        { title: "Premium TV Unit", url: "https://i.pinimg.com/736x/9c/0d/a6/9c0da618d416eba9471240fd1719aaf6.jpg" },
        { title: "Wardrobe", url: "https://i.pinimg.com/736x/ee/72/b4/ee72b42deef60b447c48a21617c4aecc.jpg" },
        // { title: "Pooja Unit", url: "https://i.pinimg.com/736x/0b/12/f4/0b12f446d69a2645f4f1f189c2808deb.jpg" }
        { title: "Pooja Unit", url: "https://i.pinimg.com/1200x/77/7c/69/777c692833e1f9cd0cff04218b3bd3b9.jpg" }
    ];

    // 2. Fetch all images concurrently into buffers
    const portfolioWorks = await Promise.all(
        portfolioUrls.map(async (work) => {
            try {
                const res = await fetch(work.url);
                const arrayBuffer = await res.arrayBuffer();
                return {
                    title: work.title,
                    buffer: Buffer.from(arrayBuffer)
                };
            } catch (e) {
                console.error(`Failed to fetch portfolio image: ${work.title}`);
                return { title: work.title, buffer: null };
            }
        })
    );

    if (portfolioWorks && portfolioWorks.length > 0) {
        currentY -= 60;
        checkPageBreak(350);

        drawText('Our Works', leftMargin, currentY, 12, fontBold, colors.primaryBlue);
        page.drawLine({ start: { x: leftMargin, y: currentY - 8 }, end: { x: leftMargin + 40, y: currentY - 8 }, thickness: 2, color: colors.termsOrange });
        currentY -= 35;

        const imgWidth = 240;
        const imgHeight = 150;
        const columnGap = 35;
        const rowGap = 40;

        let startX = leftMargin;
        let startY = currentY;

        for (let i = 0; i < portfolioWorks.length; i++) {
            const work = portfolioWorks[i];

            // TypeScript Fix: Ensure 'work' is defined before accessing its properties
            if (!work) continue;

            const isRightColumn = i % 2 !== 0;
            const xPos = isRightColumn ? startX + imgWidth + columnGap : startX;
            const yPos = startY;

            if (work.buffer) {
                const embeddedImg = await embedSafeImage(work.buffer);
                if (embeddedImg) {
                    page.drawImage(embeddedImg, { x: xPos, y: yPos - imgHeight, width: imgWidth, height: imgHeight });
                } else {
                    drawCard(xPos, yPos, imgWidth, imgHeight, colors.borderGray, rgb(0.9, 0.9, 0.9), true);
                    drawText('Image format not supported', xPos + 50, yPos - (imgHeight / 2), 9, fontRegular, colors.textLight);
                }
            }

            const titleWidth = fontBold.widthOfTextAtSize(work.title, 10);
            drawText(work.title, xPos + (imgWidth / 2) - (titleWidth / 2), yPos - imgHeight - 15, 10, fontBold, colors.textDark);

            if (isRightColumn) startY -= (imgHeight + rowGap);
        }

        currentY = startY;
        if (portfolioWorks.length % 2 !== 0) currentY -= (imgHeight + rowGap);
    }
    // ==========================================
    // --- NEW SECTION: WHY VERTICAL LIVING? ---
    // ==========================================

    currentY -= 50;
    checkPageBreak(120); // Ensure this section doesn't split across a page

    // Main Heading
    drawText('Why Vertical Living?', leftMargin, currentY, 12, fontBold, colors.primaryBlue);
    page.drawLine({ start: { x: leftMargin, y: currentY - 8 }, end: { x: leftMargin + 40, y: currentY - 8 }, thickness: 2, color: colors.termsOrange });
    currentY -= 35;

    // 3-Column Layout Calculation
    const colWidth = contentWidth / 3;
    const textOffsetX = 28; // Distance between icon and text
    const iconCenterY = currentY - 13; // Vertically center icons with the 3 lines of text

    // --- COLUMN 1: 100+ Projects (Building Icon) ---
    const col1v1X = leftMargin;

    // Draw Building Icon using safe primitives
    page.drawRectangle({ x: col1v1X, y: iconCenterY - 10, width: 10, height: 20, color: colors.primaryBlue }); // Main tower
    page.drawRectangle({ x: col1v1X + 11, y: iconCenterY - 10, width: 7, height: 14, color: colors.primaryBlue }); // Side building
    page.drawRectangle({ x: col1v1X + 2, y: iconCenterY + 2, width: 2, height: 2, color: rgb(1, 1, 1) }); // Window 1
    page.drawRectangle({ x: col1v1X + 2, y: iconCenterY - 4, width: 2, height: 2, color: rgb(1, 1, 1) }); // Window 2

    // Text
    drawText('100+ Projects', col1v1X + textOffsetX, currentY, 10, fontBold, colors.textDark);
    drawText('Delivered across', col1v1X + textOffsetX, currentY - 14, 9, fontRegular, colors.textLight);
    drawText('Chennai, zero compromise', col1v1X + textOffsetX, currentY - 26, 9, fontRegular, colors.textLight);

    // --- COLUMN 2: Factory Precision (Target/Crosshair Icon) ---
    const col2v1X = leftMargin + colWidth;
    const tX = col2v1X + 8; // Target Center X

    // Draw Precision Icon using safe primitives
    page.drawCircle({ x: tX, y: iconCenterY, size: 8, borderColor: colors.primaryBlue, borderWidth: 1.5, color: rgb(1, 1, 1) }); // Outer ring
    page.drawCircle({ x: tX, y: iconCenterY, size: 2.5, color: colors.termsOrange }); // Bullseye
    page.drawLine({ start: { x: tX - 12, y: iconCenterY }, end: { x: tX - 4, y: iconCenterY }, thickness: 1.5, color: colors.primaryBlue }); // Left tick
    page.drawLine({ start: { x: tX + 4, y: iconCenterY }, end: { x: tX + 12, y: iconCenterY }, thickness: 1.5, color: colors.primaryBlue }); // Right tick
    page.drawLine({ start: { x: tX, y: iconCenterY + 12 }, end: { x: tX, y: iconCenterY + 4 }, thickness: 1.5, color: colors.primaryBlue }); // Top tick
    page.drawLine({ start: { x: tX, y: iconCenterY - 12 }, end: { x: tX, y: iconCenterY - 4 }, thickness: 1.5, color: colors.primaryBlue }); // Bottom tick

    // Text
    drawText('Factory Precision', col2v1X + textOffsetX, currentY, 10, fontBold, colors.textDark);
    drawText('CNC-cut units.', col2v1X + textOffsetX, currentY - 14, 9, fontRegular, colors.textLight);
    drawText('No on-site guesswork.', col2v1X + textOffsetX, currentY - 26, 9, fontRegular, colors.textLight);

    // --- COLUMN 3: One Contact (Person/User Icon) ---
    const col3v1X = leftMargin + (colWidth * 2);
    const pX = col3v1X + 8; // Person Center X

    // Draw User Icon using safe primitives
    page.drawCircle({ x: pX, y: iconCenterY + 5, size: 4.5, color: colors.primaryBlue }); // Head
    // Body (Rectangle + Circles for rounded shoulders)
    page.drawRectangle({ x: pX - 6, y: iconCenterY - 10, width: 12, height: 8, color: colors.primaryBlue }); // Torso
    page.drawCircle({ x: pX - 6, y: iconCenterY - 2, size: 3, color: colors.primaryBlue }); // Left shoulder
    page.drawCircle({ x: pX + 6, y: iconCenterY - 2, size: 3, color: colors.primaryBlue }); // Right shoulder
    page.drawRectangle({ x: pX - 6, y: iconCenterY - 5, width: 12, height: 3.5, color: colors.primaryBlue }); // Fill gap

    // Text
    drawText('One Contact', col3v1X + textOffsetX, currentY, 10, fontBold, colors.textDark);
    drawText('Direct accountability.', col3v1X + textOffsetX, currentY - 14, 9, fontRegular, colors.textLight);
    drawText('No middlemen.', col3v1X + textOffsetX, currentY - 26, 9, fontRegular, colors.textLight);

    // ==========================================

    currentY -= 65; // Push down past the new 3-column grid

    page.drawLine({ start: { x: leftMargin, y: currentY }, end: { x: rightMargin, y: currentY }, thickness: 1, color: colors.borderGray });

    // ==========================================
    // --- CALL TO ACTION BANNER ---
    // ==========================================
    const ctaHeight = 50;
    checkPageBreak(ctaHeight + 60);

    // Draw an attention-grabbing rounded box (Light background, Orange border)
    drawCard(leftMargin, currentY, contentWidth, ctaHeight, colors.termsOrange, colors.bgLight, true);

    const centerOfPage = width / 2;
    const ctaHeadline = "BOOK YOUR FREE ONLINE CONSULTATION NOW";
    const ctaSubtext = "WhatsApp: +91 93639 93814   |   Response within 2 hours";

    // Dynamically calculate widths to perfectly center the text
    const headlineWidth = fontBold.widthOfTextAtSize(ctaHeadline, 11);
    const subtextWidth = fontBold.widthOfTextAtSize(ctaSubtext, 10);

    // Draw the centered text inside the box
    drawText(ctaHeadline, centerOfPage - (headlineWidth / 2), currentY - 20, 11, fontBold, colors.primaryBlue);
    drawText(ctaSubtext, centerOfPage - (subtextWidth / 2), currentY - 38, 10, fontBold, colors.textDark);

    // --- MAKE THE ENTIRE BOX CLICKABLE ---
    // Define the clickable rectangle bounds: [bottom-left X, bottom-left Y, top-right X, top-right Y]
    const ctaLink = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [leftMargin, currentY - ctaHeight, leftMargin + contentWidth, currentY],
        Border: [0, 0, 0],
        A: {
            Type: 'Action',
            S: 'URI',
            URI: PDFString.of('https://wa.me/919363993814'), // Directly opens your WhatsApp
        },
    });

    // Inject the invisible clickable link layer into the page
    const annots = page.node.lookup(PDFName.of('Annots'), PDFArray);
    if (annots) {
        annots.push(ctaLink);
    } else {
        page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([ctaLink]));
    }
    // -------------------------------------

    // Move Y cursor past the CTA box
    currentY -= (ctaHeight + 30);


    // ==========================================
    // --- 9. CLICKABLE SOCIAL LINKS & FOOTER ---
    // ==========================================
    page.drawLine({ start: { x: leftMargin, y: currentY }, end: { x: rightMargin, y: currentY }, thickness: 1, color: colors.borderGray });
    currentY -= 20;



    // // 1. Define clean PNG icons for social media
    // const socialIconUrls = {
    //     instagram: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png",
    //     youtube: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/128px-YouTube_full-color_icon_%282017%29.svg.png",
    //     whatsapp: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/120px-WhatsApp.svg.png"
    // };

    const socialIconUrls = {
        instagram: "https://img.icons8.com/fluent/48/instagram-new.png",
        youtube: "https://img.icons8.com/color/48/youtube-play.png",
        whatsapp: "https://img.icons8.com/color/48/whatsapp--v1.png"
    };

    const fetchOpts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } };

    // 2. Fetch the icons into buffers
    const [instaBuffer, ytBuffer, waBuffer] = await Promise.all([
        fetch(socialIconUrls.instagram, fetchOpts).then(res => res.arrayBuffer()).catch(() => null),
        fetch(socialIconUrls.youtube, fetchOpts).then(res => res.arrayBuffer()).catch(() => null),
        fetch(socialIconUrls.whatsapp, fetchOpts).then(res => res.arrayBuffer()).catch(() => null)
    ]);

    const socialIcons = {
        instagram: instaBuffer ? Buffer.from(instaBuffer) : null,
        youtube: ytBuffer ? Buffer.from(ytBuffer) : null,
        whatsapp: waBuffer ? Buffer.from(waBuffer) : null
    };

    // Embed the social icons right before the footer loop
    let instaImg: any, ytImg: any, waImg: any;
    if (socialIcons) {
        if (socialIcons.instagram) instaImg = await embedSafeImage(socialIcons.instagram);
        if (socialIcons.youtube) ytImg = await embedSafeImage(socialIcons.youtube);
        if (socialIcons.whatsapp) waImg = await embedSafeImage(socialIcons.whatsapp);
    }


    const socialLinks = [
        { platform: "Instagram", link: "https://instagram.com/living.vertical" },
        { platform: "YouTube", link: "https://youtube.com/@verticalliving" },
        { platform: "WhatsApp", link: "https://wa.me/919363993814" },
        { platform: "Vertical Living", link: "https://theverticalliving.com" } // Uses your company logo
    ];

    drawText('Connect with us:', leftMargin, currentY, 10, fontBold, colors.textDark);

    let linkX = leftMargin + 95;

    socialLinks.forEach((item, idx) => {
        const iconY = currentY - 2;

        // DRAW VECTOR ICONS BASED ON PLATFORM
        // DRAW IMAGES BASED ON PLATFORM
        if (item.platform === "Instagram") {
            if (instaImg) {
                page.drawImage(instaImg, { x: linkX, y: iconY, width: 12, height: 12 });
            } else {
                drawCard(linkX, iconY + 12, 12, 12, colors.primaryBlue, rgb(1, 1, 1), true); // Fallback
            }

        } else if (item.platform === "YouTube") {
            if (ytImg) {
                // YouTube logo is wider, adjust dimensions slightly for balance
                page.drawImage(ytImg, { x: linkX - 1, y: iconY + 2, width: 14, height: 10 });
            } else {
                drawCard(linkX, iconY + 11, 14, 10, colors.primaryBlue, colors.primaryBlue, true); // Fallback
            }

        } else if (item.platform === "WhatsApp") {
            if (waImg) {
                page.drawImage(waImg, { x: linkX, y: iconY, width: 12, height: 12 });
            } else {
                page.drawCircle({ x: linkX + 6, y: iconY + 6, size: 6, borderColor: colors.primaryBlue, borderWidth: 1.2, color: rgb(1, 1, 1) }); // Fallback
            }

        } else if (item.platform === "Vertical Living") {
            // RENDER COMPANY LOGO 
            if (logoImage) {
                page.drawImage(logoImage, { x: linkX, y: iconY, width: 12, height: 12 });
            } else {
                page.drawCircle({ x: linkX + 6, y: iconY + 6, size: 6, borderColor: colors.primaryBlue, borderWidth: 1.2, color: rgb(1, 1, 1) }); // Fallback
            }
        }

        // DRAW TEXT BESIDE THE ICON
        const textX = linkX + 18;
        drawClickableLink(item.platform, item.link, textX, currentY, 10, fontBold, colors.primaryBlue);

        // MAKE THE ICON ITSELF CLICKABLE
        const iconLink = pdfDoc.context.obj({
            Type: 'Annot', Subtype: 'Link', Rect: [linkX, iconY, textX, iconY + 12], Border: [0, 0, 0],
            A: { Type: 'Action', S: 'URI', URI: PDFString.of(item.link) },
        });

        const annots = page.node.lookup(PDFName.of('Annots'), PDFArray);
        if (annots) {
            annots.push(iconLink);
        } else {
            page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([iconLink]));
        }

        // CALCULATE POSITION FOR THE NEXT PLATFORM
        linkX = textX + fontBold.widthOfTextAtSize(item.platform, 10) + 12;

        if (idx < socialLinks.length - 1) {
            drawText('|', linkX, currentY, 10, fontRegular, colors.textLight);
            linkX += 12; // Gap after the pipe
        }
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};



export const sendWhatsAppAutomation = async (req: Request, res: Response,) => {


    const { clientPhone, clientName, pdfUrl } = req.body
    const WHATSAPP_TOKEN = process.env.PERMANENT_WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    console.log("WHATSAPP_TOKEN", WHATSAPP_TOKEN)
    console.log("PHONE_NUMBER_ID", PHONE_NUMBER_ID)
    console.log("clientPhone", clientPhone)

    // Ensure phone is in international format (e.g., 91xxxxxxxxxx for India)
    // const formattedPhone = clientPhone.replace(/\D/g, '');

    const rawPhone = clientPhone.replace(/\D/g, '');
    const formattedPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

    console.log("formattedPhone", formattedPhone)
    const data = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
            name: "cost_calculation_v2", // Your approved template name
            // name: "calculator_testing", // Your approved template name
            language: { code: "en" }, // Language selected in your screenshot
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "document",
                            document: {
                                link: pdfUrl,
                                // link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                                filename: "Vertical_Living_Estimation.pdf"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: clientName },      // Fills {{client_name}}
                        // { type: "text", text: "+919363993814" }, // Fills {{phone_no}}
                        // { type: "text", text: "Vertical Living" } // Fills {{company_name}}
                    ]
                }
            ]
        }
    };



    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
            data,
            { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
        );
        console.log("response", response)
        return res.status(200).json({
            ok: true,
            message: "pdf shared to mentioned number",
            data: response?.data
        });
    } catch (error: any) {
        console.log("whatsapp full error", error)
        console.error("WhatsApp API Error:", error.response?.data || error.message);
        // throw error;
        return res.status(error.response?.status || 500).json({
            ok: false,
            error: error.message
        });

    }
};





// export const sendWhatsAppAutomation = async (req: Request, res: Response,) => {

//     const { clientPhone, clientName, pdfUrl } = req.body
//     const WHATSAPP_TOKEN = process.env.PERMANENT_WHATSAPP_ACCESS_TOKEN;
//     const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

//     console.log("WHATSAPP_TOKEN", WHATSAPP_TOKEN)
//     console.log("PHONE_NUMBER_ID", PHONE_NUMBER_ID)
//     console.log("clientPhone", clientPhone)

//     // Ensure phone is in international format (e.g., 91xxxxxxxxxx for India)
//     // const formattedPhone = clientPhone.replace(/\D/g, '');

//     const rawPhone = clientPhone.replace(/\D/g, '');
//     const formattedPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

//     console.log("formattedPhone", formattedPhone)
//     const data = {
//         messaging_product: "whatsapp",
//         to: formattedPhone,
//         type: "template",
//         template: {
//             name: "vertical_living_quick_cost_calculator", // Your approved template name
//             language: { code: "en" }, // Language selected in your screenshot
//             components: [
//                 // {
//                 //     type: "header",
//                 //     parameters: [
//                 //         {
//                 //             type: "document",
//                 //             document: {
//                 //                 link: pdfUrl,
//                 //                 filename: "Vertical_Living_Estimation.pdf"
//                 //             }
//                 //         }
//                 //     ]
//                 // },
//                 {
//                     type: "body",
//                     parameters: [
//                         { type: "text", text: clientName },      // Fills {{client_name}}
//                         // { type: "text", text: "+919363993814" }, // Fills {{phone_no}}
//                         // { type: "text", text: "Vertical Living" } // Fills {{company_name}}
//                     ]
//                 },
//                 {
//                     type: "button",
//                     sub_type: "url",
//                     index: "1", // Use "1" because "View Pdf" is the second button in your list
//                     parameters: [
//                         {
//                             type: "text",
//                             text: pdfUrl // This adds the filename to your S3 base URL
//                         }
//                     ]
//                 }
//             ]
//         }
//     };

//     try {
//         const response = await axios.post(
//             `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
//             data,
//             { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
//         );
//         console.log("response", response)
//         return res.status(200).json({
//             ok: true,
//             message: "pdf shared to mentioned number",
//             data: response?.data
//         });
//     } catch (error: any) {
//         console.error("WhatsApp API Error:", error.response?.data || error.message);
//         // throw error;
//         return res.status(error.response?.status || 500).json({
//             ok: false,
//             error: error.message
//         });

//     }
// };