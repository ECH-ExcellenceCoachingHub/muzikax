const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const geoip = require('geoip-lite');
const authRoutes = require('./routes/authRoutes');
const trackRoutes = require('./routes/trackRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const creatorRoutes = require('./routes/creatorRoutes');
const albumRoutes = require('./routes/albumRoutes');
const commentRoutes = require('./routes/commentRoutes'); // Add comment routes
const eventRoutes = require('./routes/eventRoutes'); // Add event routes
const { protect } = require('./utils/jwt');
const { updateOwnProfile } = require('./controllers/profileController');
const publicRoutes = require('./routes/publicRoutes');

// Import the new feature routes
const favoriteRoutes = require('./routes/features/favoriteRoutes');
const playlistRoutes = require('./routes/features/playlistRoutes');
const recentlyPlayedRoutes = require('./routes/recentlyPlayedRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const postRoutes = require('./routes/postRoutes');

// Import public playlist routes
const publicPlaylistRoutes = require('./routes/public/playlistRoutes');

// Import WhatsApp routes
const whatsappRoutes = require('./routes/whatsappRoutes');

// Import search routes
const searchRoutes = require('./routes/searchRoutes');

// Import following routes
const followingRoutes = require('./routes/followingRoutes');

// Import report routes
const reportRoutes = require('./routes/reportRoutes');

// Import community feature routes
const communityPostRoutes = require('./routes/communityPostRoutes');
const communityCommentRoutes = require('./routes/communityCommentRoutes');
const circleRoutes = require('./routes/circleRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const liveRoomRoutes = require('./routes/liveRoomRoutes');

// Import monetization routes
const monetizationRoutes = require('./routes/monetizationRoutes');

// Import notification routes
const notificationRoutes = require('./routes/notificationRoutes');

// Import push notification routes
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');

// Import payment routes
const paymentRoutes = require('./routes/paymentRoutes');

// Import withdrawal routes
const withdrawalRoutes = require('./routes/withdrawalRoutes');

// Import contact message routes
const contactMessageRoutes = require('./routes/contactMessageRoutes');

// Import audio proxy routes
const audioProxyRoutes = require('./routes/audioProxyRoutes');

// Import chart routes
const chartRoutes = require('./routes/chartRoutes');

// Import AI music assistant routes
const aiRoutes = require('./routes/aiRoutes');

// Load env vars
dotenv.config();

// Update geoip-lite database
try {
  geoip.reloadDataSync();
  console.log('GeoIP database updated successfully');
} catch (error) {
  console.error('Failed to update GeoIP database:', error);
}

const app = express();



// Middleware
// Configure helmet with options that allow OAuth flows
app.use(helmet({
  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups'
  },
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self'"],
      childSrc: ["'self'", "https://accounts.google.com"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com"]
    }
  },
  crossOriginEmbedderPolicy: {
    policy: 'unsafe-none'
  }
}));

// Enable CORS for specific origins
const allowedOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
  [
    'https://muzikax.com',            // Production frontend
    'https://www.muzikax.com',        // Production domain (without trailing slash)
    'https://www.muzikax.com/',       // Production domain (with trailing slash)
    'https://muzikaxbackend.onrender.com', // Production backend
    'https://muzikax.vercel.app',     // Legacy domain
    'http://localhost:3000',          // Local development
    'http://localhost:3001',          // Alternative local development
    'http://localhost:8080',          // Alternative local development
    'https://localhost:3000',         // HTTPS local development
    'https://localhost:3001',         // HTTPS alternative local development
  ];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origins (handle both with and without trailing slashes)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Normalize both origins by removing trailing slashes for comparison
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const normalizedAllowed = allowedOrigin.replace(/\/+$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from origin: ${origin}`);
      console.log(`Allowed origins:`, allowedOrigins);
      callback(null, false); // Don't throw error, just deny the request
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Authorization', 'Content-Range', 'X-Content-Range'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-HTTP-Method-Override', 'X-Requested-By']
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
// DJ mode: recorded mixes + live sets
app.use('/api/dj', require('./routes/djRoutes'));
app.use('/api/users', userRoutes);

// Register post routes early to avoid conflicts
app.use('/api/posts', postRoutes);
console.log('Post routes registered');

// Register the new feature routes
app.use('/api/favorites', favoriteRoutes);
console.log('Favorites routes registered');
app.use('/api/playlists', playlistRoutes);
console.log('Playlists routes registered');
app.use('/api/recently-played', recentlyPlayedRoutes);
console.log('Recently played routes registered');
app.use('/api/recommendations', recommendationRoutes);
console.log('Recommendations routes registered');

// Register public routes first - these are accessible to everyone
console.log('About to register public routes...');
console.log('Public routes object:', publicRoutes);
app.use('/api/public', publicRoutes);
console.log('Public routes registered');

// Register public user routes (merge with public routes)
const publicUserRoutes = require('./routes/publicUserRoutes');
app.use('/api/public', publicUserRoutes);
console.log('Public user routes registered');

// Register public playlist routes
app.use('/api/public/playlists', publicPlaylistRoutes);
console.log('Public playlist routes registered');

app.use('/api/upgrade', upgradeRoutes);
console.log('Upgrade routes registered');
app.use('/api/creator', creatorRoutes);
console.log('Creator routes registered');

// Add detailed logging for upload routes
console.log('Attempting to register upload routes...');
try {
  console.log('Upload routes object:', uploadRoutes);
  app.use('/api/upload', uploadRoutes);
  console.log('Upload routes registered successfully');
} catch (error) {
  console.error('Error registering upload routes:', error);
}

// Add detailed logging for admin routes
console.log('Attempting to register admin routes...');
try {
  app.use('/api/admin', adminRoutes);
  console.log('Admin routes registered successfully');
} catch (error) {
  console.error('Error registering admin routes:', error);
}

// Add detailed logging for album routes
console.log('Attempting to register album routes...');
try {
  console.log('Album routes object:', albumRoutes);
  app.use('/api/albums', albumRoutes);
  console.log('Album routes registered successfully');
} catch (error) {
  console.error('Error registering album routes:', error);
}

// Register comment routes
console.log('Attempting to register comment routes...');
try {
  console.log('Comment routes object:', commentRoutes);
  app.use('/api/comments', commentRoutes);
  console.log('Comment routes registered successfully');
} catch (error) {
  console.error('Error registering comment routes:', error);
}

// Register event routes
console.log('Attempting to register event routes...');
try {
  console.log('Event routes object:', eventRoutes);
  app.use('/api/events', eventRoutes);
  console.log('Event routes registered successfully');
} catch (error) {
  console.error('Error registering event routes:', error);
}

// Register WhatsApp routes
console.log('Attempting to register WhatsApp routes...');
try {
  app.use('/api/whatsapp', whatsappRoutes);
  console.log('WhatsApp routes registered successfully');
} catch (error) {
  console.error('Error registering WhatsApp routes:', error);
}

// Register search routes
console.log('Attempting to register search routes...');
try {
  app.use('/api/search', searchRoutes);
  console.log('Search routes registered successfully');
} catch (error) {
  console.error('Error registering search routes:', error);
}

// Register following routes
console.log('Attempting to register following routes...');
try {
  app.use('/api/following', followingRoutes);
  console.log('Following routes registered successfully');
} catch (error) {
  console.error('Error registering following routes:', error);
}

// Register report routes
console.log('Attempting to register report routes...');
try {
  app.use('/api/reports', reportRoutes);
  console.log('Report routes registered successfully');
} catch (error) {
  console.error('Error registering report routes:', error);
}

// Register community feature routes
app.use('/api/community/posts', communityPostRoutes);
console.log('Community post routes registered');
app.use('/api/community/comments', communityCommentRoutes);
console.log('Community comment routes registered');
app.use('/api/community/circles', circleRoutes);
console.log('Circle routes registered');
app.use('/api/community/challenges', challengeRoutes);
console.log('Challenge routes registered');
app.use('/api/community/liverooms', liveRoomRoutes);
console.log('Live room routes registered');

// Register chat routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/community/chats', chatRoutes);
console.log('Chat routes registered');

// Register monetization routes
app.use('/api/monetization', monetizationRoutes);
console.log('Monetization routes registered');

// Register notification routes
app.use('/api/notifications', notificationRoutes);
console.log('Notification routes registered');

// Register push notification routes
app.use('/api/push-notifications', pushNotificationRoutes);
console.log('Push notification routes registered');

// Register payment routes
app.use('/api/payments', paymentRoutes);
console.log('Payment routes registered');

// Register withdrawal routes
app.use('/api/withdrawals', withdrawalRoutes);
console.log('Withdrawal routes registered');

// Register contact message routes
app.use('/api/contact-messages', contactMessageRoutes);
console.log('Contact message routes registered');

// Register audio proxy routes
app.use('/api/audio-proxy', audioProxyRoutes);
console.log('Audio proxy routes registered');

// Register chart routes
app.use('/api/charts', chartRoutes);
console.log('Chart routes registered');

// Register AI music assistant routes
app.use('/api/ai', aiRoutes);
console.log('AI music assistant routes registered');

// Register engagement routes (if not already included in chart routes)
// Note: Engagement tracking is handled within chart routes

// Directly implement profile update route in app.js to avoid 404 issues
// User route for updating own profile directly in app
app.put('/api/profile/me', protect, updateOwnProfile);

// Simple test route for tracks
app.get('/api/test-tracks', (_req, res) => {
  console.log('TEST TRACKS ROUTE HIT');
  res.json({ message: 'Test tracks route working' });
});

// Log all registered routes for debugging
console.log('Registered routes:');
if (app._router && app._router.stack) {
  app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    }
  });
}

// Specifically log auth routes
console.log('Auth routes specifically:');
const authRouter = require('./routes/authRoutes');
if (authRouter && authRouter.stack) {
  authRouter.stack.forEach((r) => {
    if (r.route && r.route.path) {
      console.log(`  AUTH: ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    }
  });
}

// Health check
app.get('/health', (_req, res) => {
  console.log('HEALTH CHECK ROUTE HIT');
  res.status(200).json({ 
    message: 'OK', 
    timestamp: new Date().toISOString(),
    status: 'healthy',
    uptime: process.uptime()
  });
});

// CORS test route - simple endpoint to test if server is reachable
app.get('/api/test-cors', (_req, res) => {
  console.log('CORS TEST ROUTE HIT');
  res.status(200).json({ 
    message: 'CORS test successful', 
    timestamp: new Date().toISOString(),
    corsWorking: true
  });
});

// Simple test route
app.get('/test-direct', (_req, res) => {
  console.log('DIRECT TEST ROUTE HIT');
  res.json({ message: 'Direct test route working' });
});

// Error handler
app.use((err, _req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;