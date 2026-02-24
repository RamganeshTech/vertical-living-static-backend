import express, { type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes.js';
import connectDB from './config/connectDb.js';
import publicCostCalculatorRoutes from './routes/publicCostCalculator.routes.js';
import downloadRouter from './routes/downloadRoute.routes.js';

// Load environment variables
dotenv.config();

const app: Application = express();



app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))


// // Middleware
// app.use(cors({
//     origin: '*', // You can restrict this to your Vertical Living domain later
//     methods: ['POST', 'GET'],
//     allowedHeaders: ['Content-Type']
// }));

app.use(express.json());

// Routes
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/calculator', publicCostCalculatorRoutes);
app.use(downloadRouter)


// Health Check (Optional but recommended for EC2 monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'active', messsage:"server running", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`🚀 Vertical Living AI Backend running on http://localhost:${PORT}`);
// });



connectDB()
  .then(async () => {

    // try {
    //   await agenda.start();
    //   console.log("✔ Agenda Automation Engine Started");
    // } catch (agendaError) {
    //   console.error("❌ Agenda failed to start:", agendaError);
    // }



    app.listen(PORT, () => {   // <- start the HTTP server, not app
      console.log("DB connected");
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.log("error from DB connection", error.message);
  });