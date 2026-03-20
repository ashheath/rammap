import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vehicleRoutes from './routes/vehicles.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
// Middleware: CORS
const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);
const isAllowedOrigin = (origin) => {
    if (allowedOrigins.includes(origin))
        return true;
    try {
        const url = new URL(origin);
        const hostname = url.hostname.toLowerCase();
        if (hostname === 'rammap.uk' || hostname === 'www.rammap.uk' || hostname.endsWith('.rammap.uk')) {
            return true;
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return true;
        }
    }
    catch {
        return false;
    }
    return false;
};
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (e.g., mobile apps, curl)
        if (!origin)
            return callback(null, true);
        if (isAllowedOrigin(origin))
            return callback(null, true);
        return callback(new Error('CORS blocked'));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/vehicles', vehicleRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📍 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
