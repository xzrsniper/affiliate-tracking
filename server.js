import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import './models/index.js'; // Import models to register associations

// Import routes
import authRoutes from './routes/auth.js';
import trackRoutes from './routes/track.js';
import linkRoutes from './routes/links.js';
import adminRoutes from './routes/admin.js';
import redirectRoutes from './routes/redirect.js';
import websiteRoutes from './routes/websites.js';
import pageContentRoutes from './routes/pageContent.js';
import pageStructureRoutes from './routes/pageStructure.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS: Allow requests from ANY origin (for JS pixel on client domains)
app.use(cors({
  origin: '*', // Allow all origins for tracking pixel
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Visitor-ID', 'X-Tracker-Version', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['X-Tracker-Version'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicitly handle OPTIONS requests for CORS preflight
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Enable cookie parsing for conversion tracking

// Trust proxy for accurate IP detection (if behind reverse proxy)
app.set('trust proxy', true);

// Serve static files (for tracker.js)
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Tracking redirect route (must be before API routes)
app.use('/track', redirectRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/page-structure', pageStructureRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.warn('⚠️  Warning: Failed to connect to database. Server will start but database features may not work.');
      console.warn('⚠️  Please ensure MySQL is running and database is configured.');
      // Do not exit, allow server to start for frontend development
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (!connected) {
        console.warn('⚠️  Database connection failed - some features may not work');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Still try to start the server even if DB connection fails
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT} (without database)`);
      console.warn('⚠️  Database connection failed - some features may not work');
    });
  }
};

startServer();

export default app;
