import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { initQueue, registerWorker } from './services/queue/queue.js';
import { processReviewJob } from './services/workers/reviewWorker.js';
import apiRouter from './routes/api.js';

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5001;

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(morgan('dev'));

// Parse JSON with rawBody capturing for signature checking
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ extended: true }));

// Map API endpoints
app.use('/api', apiRouter);

// Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

const startServer = async () => {
  try {
    // 1. Connect database (MongoDB or local JSON fallback)
    await connectDB();

    // 2. Initialize background review queue
    await initQueue();

    // 3. Register queue processing worker task
    registerWorker(processReviewJob);

    // 4. Start HTTP Server
    app.listen(PORT, () => {
      console.log(`🚀 AI Reviewer Backend active on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();

// Dev server trigger restart comment
