
import { type Request, type Response } from 'express';
import { genAI } from '../config/gemini.js';

// PROMPT VERION 1
// const SYSTEM_PROMPT = `
//   You are the official AI Assistant for Vertical Living, a luxury interior design firm.
//   Your tone is professional, sophisticated, and helpful.

//   CORE RULES:
//   - Respond in PLAIN TEXT ONLY.
//   - NEVER use asterisks (*), underscores (_), or hashes (#) for formatting.
//   - DO NOT use bolding, italics, or bullet points using special characters.
//   - If you need to list items, use plain numbers (1. 2. 3.) or simple dashes (-).

//   Key Information:
//   - We specialize in high-rise apartments and gated communities.
//   - Packages: Basic (₹4 Lakhs), Premium (₹8 Lakhs), Luxury (₹12 Lakhs).
//   - Consultation: 1-on-1 expert session costs ₹4,999.
//   - If a user asks about payments, mention that they can they can call to our sales team via the number mentioned in our site and know the price for thier plans .
//   - Do not answer questions unrelated to interior design or Vertical Living.
//   `;


const getManualResponse = (userMessage: string): string => {
    const query = userMessage.toLowerCase();

    const knowledgeBase = [
        {
            // Basic Enquiries & Source
            keywords: ["number", "how", "get", "enquiry", "whatsapp", "contact", "ad"],
            reply: "We received your enquiry through our WhatsApp advertisement regarding interior works."
        },
        {
            // Location & Physical Office
            keywords: ["location", "chennai", "where", "office", "showroom", "place", "area", "address"],
            reply: "We are based in Chennai and handle projects across the city and nearby areas. We operate from Chennai and can schedule a meeting at our office if required."
        },
        {
            // Experience & Scale
            keywords: ["experience", "how long", "years", "projects", "completed", "portfolio", "many"],
            reply: "We have solid experience in complete home interior execution and have successfully executed multiple residential and commercial interior projects with structured execution processes."
        },
        {
            // Company Model
            keywords: ["contractor", "company", "who", "firm", "full interior"],
            reply: "We are a complete interior execution company handling design, production, and installation, rather than individual contractors."
        },
        {
            // 10. Epoxy Flooring (Separated)
            keywords: ["epoxy", "flooring"],
            reply: "Yes, we do epoxy flooring as part of our complete interior projects."
        },
        {
            // 11. Electrical & Painting (Separated)
            keywords: ["electrical", "painting", "modification", "light", "wire"],
            reply: "Yes, we handle electrical modifications and painting related to interiors."
        },
        {
            // Design & Revisions
            keywords: ["3d", "design", "revision", "changes", "style", "modern", "traditional", "ideas", "drawing"],
            reply: "Detailed 3D designs are provided after the consultation stage. We provide structured revisions and customize designs (modern or traditional) based on your preference. We can also refine and execute your own ideas."
        },
        // {
        //     // Pricing & Specific BHK Costs
        //     keywords: ["price", "cost", "rate", "sq.ft", "sqft", "2bhk", "3bhk", "fixed", "lakhs"],
        //     reply: "Interior pricing typically ranges from 1,500 to 2,500 per sq.ft. A 2BHK starts from 6-8 lakhs, and a 3BHK starts from 8-10 lakhs. Pricing depends on plywood grade, laminates, and design complexity."
        // },

        {
            // Per Sq.Ft Rate
            keywords: ["per sq.ft", "sqft rate", "square foot", "price per foot"],
            reply: "Interior pricing typically ranges from 1,500 to 2,500 per sq.ft depending on materials and customization."
        },

        {
            // 2BHK Cost
            keywords: ["2bhk", "2 bhk", "two bedroom"],
            reply: "A 2BHK interior usually starts from 6–8 lakhs depending on finishes."
        },
        {
            // 3BHK Cost
            keywords: ["3bhk", "3 bhk", "three bedroom"],
            reply: "A 3BHK interior usually starts from 8–10 lakhs depending on material selection and scope."
        },

        {
            // Negotiation & Lower Quotes
            keywords: ["lower", "reduce", "discount", "minimum", "cheap", "another company", "compare", "comparision"],
            reply: "Our pricing reflects material quality and finishing standards. We can optimize material selection to align with your budget, but we do not compromise on structural quality."
        },
        {
            // Execution & Factory
            keywords: ["time", "long", "days", "finish", "factory", "on-site", "supervision", "monitoring"],
            reply: "Projects typically take 30-45 days. Most modular components are factory-finished for better precision. Execution is regularly monitored for quality control."
        },
        {
            // Materials & Quality
            keywords: ["plywood", "bwp", "bwr", "laminate", "hardware", "waterproof", "kitchen", "isi"],
            reply: "We use ISI-certified BWP and BWR plywood. For kitchens, we recommend BWP for moisture resistance. We use branded laminates and quality hardware based on durability."
        },
        {
            // Payment, GST & Contract
            keywords: ["payment", "structure", "stages", "milestone", "agreement", "contract", "gst", "written"],
            reply: "Payments are milestone-based aligned with project stages. We provide a detailed written agreement and GST is applicable as per government regulations."
        },
        // {
        //     // Warranty & After Sales
        //     keywords: ["warranty", "damage", "repair", "maintenance", "after sales", "service"],
        //     reply: "Warranty is provided on manufacturing defects and hardware per company policy. We provide after-sales service support for genuine issues and maintenance guidance."
        // },

        {
            // Warranty
            keywords: ["warranty", "guarantee", "manufacturing defect"],
            reply: "Yes, a warranty is provided on manufacturing defects and hardware as per company policy."
        },
        {
            // After Sales & Maintenance
            keywords: ["damage", "repair", "maintenance", "after sales", "service support", "fix"],
            reply: "We provide after-sales service support for genuine issues and maintenance guidance to ensure your interiors stay in top condition."
        },
        {
            // Consultation Fees
            keywords: ["visit", "free", "charge", "fee", "site visit", "why charge"],
            reply: "We provide professional paid consultations including measurements and planning to ensure detailed guidance. The fee is adjusted in the final billing if you proceed."
        },
        {
            // 3. What Makes You Unique (Separated)
            keywords: ["unique", "different", "makes you unique", "why you", "special"],
            reply: "We focus on long-term durability, premium materials, and professional execution, which sets us apart from others."
        }



    ];


    let bestMatch = { score: 0, reply: "" };

    for (const item of knowledgeBase) {
        const score = item.keywords.reduce((acc, word) => acc + (query.includes(word) ? 1 : 0), 0);
        if (score > bestMatch.score) {
            bestMatch = { score, reply: item.reply };
        }
    }

    // Default next step if no specific keyword matches
    return bestMatch.score > 0
        ? bestMatch.reply
        : "To proceed professionally with your Vertical Living project, we can schedule a paid consultation visit. Would you prefer a weekday or weekend?";
};


const SYSTEM_PROMPT = `
  You are the official AI Assistant for Vertical Living, a luxury interior design firm.
  Your tone is professional, sophisticated, and helpful.
  
  CORE RULES:
  - Respond in PLAIN TEXT ONLY.
  - NEVER use asterisks (*), underscores (_), or hashes (#) for formatting.
  - DO NOT use bolding, italics, or bullet points using special characters.
  - If you need to list items, use plain numbers (1. 2. 3.) or simple dashes (-).
  
KNOWLEDGE BASE - BASIC ENQUIRIES:
  1. ENQUIRY SOURCE: If users ask how we got their number or why we are contacting them, explain that we received their enquiry through our WhatsApp advertisement regarding interior works.
  2. LOCATION: If users ask about our location, city, or areas of operation, state that we are based in Chennai and handle projects across the city and nearby areas.
  3. PHYSICAL PRESENCE: If users ask for a shop, office, or showroom, confirm that we operate from Chennai and can schedule a meeting at our office if required.
  4. PORTFOLIO & SCALE: If users ask about our experience or the number of projects, state that we have successfully executed multiple residential and commercial interior projects with structured execution processes.


  KNOWLEDGE BASE - EXPERIENCE & CREDIBILITY:
  1. TENURE/EXPERIENCE: If asked about how long we have been in the field, state that we have solid experience in complete home interior execution including design, manufacturing, and installation.
  2. PORTFOLIO ACCESS: If users ask for photos, confirm that we can share our completed project portfolio on WhatsApp for their reference.
  3. CLIENT REFERENCES: If asked to speak with previous clients, state that client references can be arranged at the appropriate discussion stage.
  4. COMPANY MODEL: If asked if we are contractors, clarify that we are a complete interior execution company handling design, production, and installation.


  KNOWLEDGE BASE - DESIGN QUESTIONS:
  1. 3D VISUALIZATION: If users ask about 3D designs, confirm that detailed 3D designs are provided after the consultation stage.
  2. REVISIONS: If asked about changes, state that we provide structured revisions to ensure the design aligns with their expectations.
  3. DESIGN STYLES: Confirm that we customize designs (modern, traditional, etc.) based on the client's preferred style and space requirements.
  4. CLIENT INPUT: If a user wants to share ideas, encourage them by saying we can absolutely refine and professionally execute their own design ideas.


  KNOWLEDGE BASE - PRICING QUESTIONS:
  1. PER SQ.FT RATE: Interior pricing typically ranges from 1,500 to 2,500 per sq.ft depending on materials and customization.
  2. 2BHK COST: A 2BHK interior usually starts from 6–8 lakhs depending on finishes.
  3. 3BHK COST: A 3BHK interior usually starts from 8–10 lakhs depending on material selection and scope.
  4. FIXED RATE EXPLANATION: If asked why we don’t give a fixed rate, explain that interior cost depends on plywood grade, laminates, hardware brands, storage needs, and design complexity.


  KNOWLEDGE BASE - BUDGET & NEGOTIATION:
  1. LOWER QUOTES: If a user mentions another company quoting lower, explain that pricing differs based on material quality, finishing standards, and the execution process.
  2. PRICE REDUCTION: If asked to reduce the price, state that we can optimize material selection or scope, but we do not compromise on structural quality.
  3. MINIMUM COST: If asked for the minimum cost, explain that minimum cost depends on scope and materials, and we can customize based on their budget alignment and we can focus on selective areas like kitchen and wardrobes instead of full interiors.
  4. OBJECTION RELATED TO THE PRICE: If client asks why you have high price,  Pricing varies based on quality and finishing standards. May I know what range you were
quoted?.
    5. COMPARISION WITH OTHER ORGANIZATION: If the user is comparing with other companies,  We encourage comparison. We focus on durability, quality materials, and structured
execution.


  KNOWLEDGE BASE - EXECUTION PROCESS:
  1. TIMELINE: If asked how long the project will take, explain that it typically takes 30–45 days depending on project size and scope.
  2. TIMELY DELIVERY: If asked about completing on time, state that we follow structured scheduling and milestone-based execution to ensure timely delivery.
  3. MANUFACTURING LOCATION: If asked where we manufacture, explain that most modular components are factory-finished for better precision and quality.
  4. SUPERVISION: If asked about monitoring, confirm that project execution is regularly monitored to ensure quality control.
  5. PROJECT DEALY: If asked about project delaay, explain We follow structured scheduling and regular progress updates..

  KNOWLEDGE BASE - MATERIALS & QUALITY:
  1. PLYWOOD TYPE: If asked what plywood we use, state that we use ISI-certified BWP (Boiling Water Proof) and BWR (Boiling Water Resistant) plywood depending on the application area.
  2. LAMINATES: If asked about laminates, explain that we use branded laminates including matte, glossy, textured, and acrylic finishes.
  3. HARDWARE BRANDS: If asked about hardware, state that we use quality hardware brands selected based on durability and client budget.
  4. WATERPROOF KITCHENS: If asked if the kitchen is waterproof, explain that for kitchen areas, we recommend BWP plywood for superior moisture resistance.
  5. SUPPLY MATERIALS BY CLIENT: If asked if the client can supply material, explain that We prefer complete execution control to ensure quality consistency.


  KNOWLEDGE BASE - PAYMENT & CONTRACT:
  1. PAYMENT STRUCTURE: If asked about the payment structure, explain that payments are milestone-based aligned with project stages.
  2. EMI OPTIONS : If asked about the EMI options,  EMI or phased payment options can be discussed during consultation.
  3. WRITTEN AGREEMENT: If asked about documentation, confirm that we provide a detailed agreement covering scope, materials, payment terms, and timeline.
  4. GST: If asked about taxes, state that GST is applicable as per government regulations.
  5. STAGED PAYMENTS: If asked if they can pay in stages, confirm that yes, payments are structured according to project milestones.


  KNOWLEDGE BASE - WARRANTY & AFTER SALES:
  1. WARRANTY: If asked about a warranty, state that yes, a warranty is provided on manufacturing defects and hardware as per company policy.
  2. FUTURE DAMAGE: If a user asks what happens if something gets damaged later, explain that we provide after-sales service support for genuine issues.
  3. MAINTENANCE: If asked about maintenance, explain that maintenance guidance is provided, and service support can be arranged if required.

  KNOWLEDGE BASE - CONSULTATION & CLOSING:
  1. SITE VISIT COST: If asked if the site visit is free, explain that we provide professional paid consultation including measurements and planning. Mention that the consultation fee is adjusted in the final billing if they proceed.
  2. WHY CHARGE?: If users ask why others offer free visits while we charge, explain that we provide structured professional consultation ensuring serious planning and detailed guidance.
  3. NEXT STEP: To proceed professionally, suggest scheduling a paid consultation visit and ask the user if they would prefer a weekday or weekend.
  4. WHAT MAKES YOU UNIQUE: if the client asks what makes you different from others, then explain them We focus on long-term durability, premium materials, and professional execution
  4. SMALL WORKS: if the client asks do you do only small works, then explain them We primarily focus on complete interior execution but can evaluate scope.
  4. EPOXY FLOORING: if the client asks do you epoxy flooring, then explain them Yes, as part of complete interior projects.
  4.  Electrical & Painting: if the client asks do you electrical or painting, then explain them Yes, we handle electrical modifications and painting related to interiors

  CLOSING RULES:
  - Do not answer questions unrelated to interior design or Vertical Living.
  - If you cannot find a specific answer in your knowledge base, politely suggest scheduling a professional consultation.

`;



//   - If a user asks about payments, mention that they can pay securely via our website. //replace this prompt once we integrate the razorpay in our site

export const handleChat = async (req: Request, res: Response): Promise<void> => {
    const { message, history } = req.body;
    try {

        if (!message) {
            res.status(400).json({ message: "Message is required", ok: false });
            return;
        }

        // 1. Sanitize History: Remove any entries that don't have text data
        const sanitizedHistory = (history || []).filter((item: any) =>
            item.parts &&
            item.parts[0] &&
            item.parts[0].text &&
            item.parts[0].text.trim() !== ""
        );


        // 2. The Correct SDK Call (System Instruction inside Config)
        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: [
                ...sanitizedHistory,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                // FIXED: systemInstruction is now inside the config object
                // systemInstruction: "You are a professional Lead Production Engineer for Vertical Living.",
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.2, // Low for precision
                maxOutputTokens: 500
            },
        });

        // The new SDK allows direct access via result.text
        // const responseText = result?.text() || "";

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";


        res.status(200).json({
            reply: responseText,
            ok: true,
        });



    } catch (error: any) {
        console.error("Gemini Execution Error:", error);

        if (error.message?.includes("429") || error.message?.includes("exhausted")) {
            console.warn("API Limit Reached - Using Manual Knowledge Base");
            const fallbackReply = getManualResponse(message);
            res.status(200).json({ reply: fallbackReply, ok: true, fallbackReply: true });
            return;
        }



        // 3. Absolute safety response
        // res.status(200).json({
        //     // reply: "To provide the best guidance for your home, I recommend scheduling a paid consultation visit. Would you prefer a weekday or weekend?",
        //     reply: "please try after sometime",
        //     ok: false
        // });
    }


    // res.status(500).json({
    //     error: "The AI service is currently unavailable.",
    //     ok: false,
    //     message: error.message,
    //     reply: "please try after sometime"
    // });

};