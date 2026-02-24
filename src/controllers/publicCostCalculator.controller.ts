import PublicQuoteCalculatorModel from '../model/publicQuoteCalculator.model.js';
import type { Request, Response } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadFileToS3New } from '../utils/s3UploadsNew.js';
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



// export const createPublicQuote = async (req: Request, res: Response) => {





//     try {
//         const { name, phone, location, carpetArea, homeType, finish, estimate } = req.body;

        

        
       
//         // 1. Create PDF via pdf-lib with better styling
//         const pdfDoc = await PDFDocument.create();
//         const page = pdfDoc.addPage([612, 792]); // US Letter size (8.5" x 11")
//         const { width, height } = page.getSize();

//         // Load fonts at the beginning (FIXED: load once, not multiple times)
//         const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//         const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

//         // Colors
//         const goldColor = rgb(0.92, 0.75, 0.15); // Rich gold #EBC21E
//         const darkGray = rgb(0.2, 0.2, 0.2);
//         const lightGray = rgb(0.95, 0.95, 0.95);
//         const mediumGray = rgb(0.5, 0.5, 0.5);
//         const white = rgb(1, 1, 1);
//         const black = rgb(0, 0, 0);

//         // Background subtle pattern (light gray rectangle)
//         page.drawRectangle({
//             x: 0, y: 0,
//             width: width,
//             height: height,
//             color: rgb(0.99, 0.99, 0.99),
//         });

//         // Header Section with Gold Background
//         page.drawRectangle({
//             x: 0, y: height - 120,
//             width: width,
//             height: 120,
//             color: goldColor,
//         });

//         // Logo/Company Name
//         page.drawText('VERTICAL', { 
//             x: 50, 
//             y: height - 60, 
//             size: 28, 
//             color: white,
//             font: helveticaBold // Using pre-loaded font
//         });
        
//         page.drawText('LIVING', { 
//             x: 50, 
//             y: height - 95, 
//             size: 24, 
//             color: white,
//             font: helveticaBold
//         });

//         // "QUOTATION" text on header
//         page.drawText('QUOTATION', { 
//             x: width - 200, 
//             y: height - 75, 
//             size: 32, 
//             color: white,
//             font: helveticaBold
//         });

//         // Decorative line under header
//         page.drawRectangle({
//             x: 0, y: height - 125,
//             width: width,
//             height: 5,
//             color: darkGray,
//         });

//         // Client Information Section
//         const infoStartY = height - 180;
        
//         // White card for client info
//         page.drawRectangle({
//             x: 40,
//             y: infoStartY - 80,
//             width: 250,
//             height: 100,
//             color: white,
//             borderColor: goldColor,
//             borderWidth: 1,
//         });

//         page.drawText('CLIENT DETAILS', {
//             x: 55,
//             y: infoStartY - 25,
//             size: 12,
//             color: goldColor,
//             font: helveticaBold
//         });

//         page.drawText(`Name: ${name}`, {
//             x: 55,
//             y: infoStartY - 45,
//             size: 11,
//             color: darkGray,
//             font: helvetica
//         });

//         page.drawText(`Phone: ${phone}`, {
//             x: 55,
//             y: infoStartY - 60,
//             size: 11,
//             color: darkGray,
//             font: helvetica
//         });

//         page.drawText(`Location: ${location}`, {
//             x: 55,
//             y: infoStartY - 75,
//             size: 11,
//             color: darkGray,
//             font: helvetica
//         });

//         // Date on the right
//         const today = new Date();
//         const dateStr = today.toLocaleDateString('en-IN', {
//             day: 'numeric',
//             month: 'long',
//             year: 'numeric'
//         });
        
//         page.drawText(`Date: ${dateStr}`, {
//             x: width - 200,
//             y: infoStartY - 45,
//             size: 11,
//             color: mediumGray,
//             font: helvetica
//         });

//         // Project Details Card
//         const projectCardY = infoStartY - 120;
        
//         page.drawRectangle({
//             x: 40,
//             y: projectCardY - 100,
//             width: width - 80,
//             height: 120,
//             color: white,
//             borderColor: lightGray,
//             borderWidth: 1,
//         });

//         // Project Details Title
//         page.drawText('PROJECT SPECIFICATIONS', {
//             x: 55,
//             y: projectCardY - 25,
//             size: 12,
//             color: goldColor,
//             font: helveticaBold
//         });

//         // Create a grid for project details
//         const details = [
//             { label: 'Home Type', value: homeType },
//             { label: 'Carpet Area', value: `${carpetArea} sq.ft.` },
//             { label: 'Finish Style', value: finish },
//         ];

//         let xPos = 55;
//         details.forEach((detail) => {
//             // Background for each detail
//             page.drawRectangle({
//                 x: xPos - 5,
//                 y: projectCardY - 70,
//                 width: 150,
//                 height: 45,
//                 color: lightGray,
//             });

//             page.drawText(detail.label, {
//                 x: xPos,
//                 y: projectCardY - 50,
//                 size: 9,
//                 color: mediumGray,
//                 font: helvetica
//             });

//             page.drawText(detail.value, {
//                 x: xPos,
//                 y: projectCardY - 70,
//                 size: 14,
//                 color: darkGray,
//                 font: helveticaBold
//             });

//             xPos += 170;
//         });

//         // Estimate Section
//         const estimateY = projectCardY - 160;

//         // Gold decorative bar
//         page.drawRectangle({
//             x: 40,
//             y: estimateY - 10,
//             width: 100,
//             height: 4,
//             color: goldColor,
//         });

//         page.drawText('ESTIMATED VALUE', {
//             x: 40,
//             y: estimateY - 25,
//             size: 16,
//             color: darkGray,
//             font: helveticaBold
//         });

//         // Large estimate box
//         page.drawRectangle({
//             x: 40,
//             y: estimateY - 120,
//             width: width - 80,
//             height: 90,
//             color: white,
//             borderColor: goldColor,
//             borderWidth: 2,
//         });

//         // FIXED: Use INR instead of ₹ symbol
//         const formattedEstimate = `INR ${estimate.toLocaleString('en-IN')}`;

//         page.drawText('TOTAL AMOUNT', {
//             x: 60,
//             y: estimateY - 60,
//             size: 14,
//             color: mediumGray,
//             font: helvetica
//         });

//         page.drawText(formattedEstimate, {
//             x: 60,
//             y: estimateY - 100,
//             size: 42,
//             color: goldColor,
//             font: helveticaBold
//         });

//         // Terms and Conditions
//         const termsY = estimateY - 180;

//         page.drawText('Terms & Conditions:', {
//             x: 40,
//             y: termsY,
//             size: 10,
//             color: darkGray,
//             font: helveticaBold
//         });

//         const terms = [
//             '• This is a preliminary estimate and subject to site verification',
//             '• GST will be applicable as per prevailing rates',
//             '• Valid for 30 days from the date of issue',
//             '• Payment terms: 50% advance, remaining as per milestone',
//         ];

//         terms.forEach((term, index) => {
//             page.drawText(term, {
//                 x: 40,
//                 y: termsY - 15 - (index * 15),
//                 size: 8,
//                 color: mediumGray,
//                 font: helvetica
//             });
//         });

//         // Footer
//         page.drawRectangle({
//             x: 0,
//             y: 30,
//             width: width,
//             height: 1,
//             color: goldColor,
//         });

//         page.drawText('Vertical Living - Premium Interior Designs', {
//             x: 40,
//             y: 15,
//             size: 8,
//             color: mediumGray,
//             font: helvetica
//         });

//         page.drawText('www.verticalliving.com | contact@verticalliving.com', {
//             x: width - 250,
//             y: 15,
//             size: 8,
//             color: mediumGray,
//             font: helvetica
//         });

//         const pdfBytes = await pdfDoc.save();

//         // 2. Upload to S3
//         const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
//         const timestamp = Date.now();
//         const filename = `${sanitizedName}_${timestamp}_Quote.pdf`;

//         const fakeFile = {
//             buffer: Buffer.from(pdfBytes),
//             originalname: filename,
//             mimetype: 'application/pdf'
//         };

//         const quotationData = await uploadFileToS3New(fakeFile);


//         // 3. Save to MongoDB
//         const newQuote = new PublicQuoteCalculatorModel({
//             name, phone, location, carpetArea, homeType, finish, estimate,
//             quotationPdf: quotationData
//         });

//         await newQuote.save();

//         res.status(201).json({
//             ok: true,
//             message: "Quotation generated and saved successfully",
//             url: quotationData.url // Send this to frontend for download button
//         });

//     } catch (error) {
//         console.error("Quote Error:", error);
//         res.status(500).json({ ok: false, message: "Error generating quotation" });
//     }
// };



export const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";
export const COMPANY_NAME = "Vertical Living";
export const createPublicQuote = async (req: Request, res: Response) => {
    try {
        const { name, phone, location, carpetArea, homeType, finish, estimate } = req.body;

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

        page.drawText('+91 93639 93814', {
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
            quotationPdf: quotationData
        });

        await newQuote.save();

        res.status(201).json({
            ok: true,
            message: "Quotation generated and saved successfully",
            url: quotationData.url
        });

    } catch (error) {
        console.error("Quote Error:", error);
        res.status(500).json({ ok: false, message: "Error generating quotation" });
    }
};