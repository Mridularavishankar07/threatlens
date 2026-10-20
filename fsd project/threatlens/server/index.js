const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scans');
const trainingRoutes = require('./routes/training');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const emailRoutes = require('./routes/emails');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((url) => url.trim()) : [])
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check exact match in allowed list or cloud hosting domains
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.endsWith('.onrender.com') || 
                      origin.endsWith('.netlify.app') || 
                      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  skipSuccessfulRequests: true, // Don't penalize successful logins or session checks
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    version: '1.0.0',
    auth: {
      jwtMode: process.env.JWT_SECRET ? 'custom-env' : 'builtin-fallback',
      ready: true
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Connect to MongoDB
let memoryServer = null;

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const primaryUri = process.env.MONGO_URI || (!isProduction ? 'mongodb://localhost:27017/threatlens' : null);

  if (!primaryUri) {
    console.error('❌ MONGO_URI environment variable is missing!');
    console.error('👉 Please configure MONGO_URI in your Render service Environment tab.');
    process.exit(1);
  }

  try {
    // Attempt connecting to configured MONGO_URI with a 5-second timeout
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB connected successfully`);
  } catch (err) {
    console.warn(`⚠️ Could not connect to MongoDB (${err.message})`);

    if (isProduction) {
      console.error('❌ Cannot run in production without a valid MongoDB connection.');
      console.error('👉 Ensure your MongoDB Atlas connection string is correct and 0.0.0.0/0 is whitelisted in Atlas Network Access.');
      process.exit(1);
    }

    console.log('🔄 Starting automatic in-memory MongoDB development instance...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'threatlens'
        }
      });

      const memoryUri = memoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ Connected to In-Memory MongoDB at: ${memoryUri}`);
    } catch (fallbackErr) {
      console.error('❌ Failed to start in-memory MongoDB fallback:', fallbackErr.message);
      process.exit(1);
    }
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, async () => {
    console.log(`🚀 ThreatLens Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);

    // If in-memory mode, auto-seed demo accounts
    if (memoryServer) {
      try {
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log('🌱 Populating demo data and default user accounts...');
          const { seed } = require('./utils/seeder');
          await seed(false);
        }
      } catch (seedErr) {
        console.warn('⚠️ Auto-seed note:', seedErr.message);
      }
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
      console.error(`💡 Tip: Close any existing Node process or run 'npx kill-port ${PORT}'.`);
    } else {
      console.error('❌ Server error:', err.message);
    }
    process.exit(1);
  });
});

const gracefulShutdown = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
