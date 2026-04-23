import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import trackingRoutes from './routes/tracking';
import aiRoutes from './routes/ai';
import alertRoutes from './routes/alerts';
import communityRoutes from './routes/community';
import professionalRoutes from './routes/professionals';
import expertSelfRoutes from './routes/professional';
import adminRoutes from './routes/admin';
import partnerRoutes from './routes/partner';
import emergencyRoutes from './routes/emergency';
import verificationRoutes from './routes/verification';
import educationRoutes from './routes/education';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Simple Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the MamaSafe Backend API. Server is running.');
});

// Main App Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/professional', expertSelfRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/education', educationRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'MamaSafe Core API' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
