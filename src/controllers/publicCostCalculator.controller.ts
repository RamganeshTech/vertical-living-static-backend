import PublicQuoteCalculatorModel from '../model/publicQuoteCalculator.model.js';
import type { Request, Response } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadFileToS3New } from '../utils/s3UploadsNew.js';
import axios from 'axios';

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




export const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";
export const COMPANY_NAME = "Vertical Living";
export const createPublicQuote = async (req: Request, res: Response) => {
    try {
        const { name, phone, location, carpetArea, homeType, finish, estimate, config } = req.body;

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

            const brandText = "Vertical Living";
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

        // calculate center position
        const textWidth = helveticaBold.widthOfTextAtSize(consultationText, 9);
        const centerX = (width - textWidth) / 2;

        page.drawText(consultationText, {
            x: centerX,
            y: yPosition,
            size: 9,
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
            quotationPdf: quotationData, config
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
            name: "cost_calculation", // Your approved template name
            language: { code: "en" }, // Language selected in your screenshot
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "document",
                            document: {
                                link: pdfUrl,
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