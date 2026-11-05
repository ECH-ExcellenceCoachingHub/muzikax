require('dotenv').config();

const { initChartAggregator } = require('./jobs/chartAggregator');
const { initializeScheduledJobs } = require('./jobs/scheduledEmailJobs');
const redisCache = require('./utils/redisCache');
const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB FIRST before creating the app
let app;

const initializeServer = async () => {
  try {
    // Import DB connection
    const connectDB = require('./config/db');
    
    // Connect to MongoDB first
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Now import the app after DB is connected
    app = require('./app');
    
    // Create HTTP server with Socket.IO
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Store io instance for use in other modules
    app.io = io;

    // Live DJ sets (audio relay, chat, reactions)
    require('./services/liveRelay').registerSocketHandlers(io);
    
    // Real-time chart updates
    io.on('connection', (socket) => {
      console.log('🔌 Client connected:', socket.id);
      
      socket.on('join-charts', (room) => {
        socket.join(`charts:${room}`);
        console.log(`Client ${socket.id} joined charts:${room}`);
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });
    });
    
    // Broadcast chart updates - moved to separate module to avoid circular dependency
    const broadcastChartUpdate = (chartType, data) => {
      if (io) {
        io.to(`charts:${chartType}`).emit('chart-updated', {
          type: chartType,
          data,
          timestamp: new Date()
        });
      }
    };
    
    // Export for use in other modules
    module.exports.httpServer = httpServer;
    module.exports.io = io;
    module.exports.broadcastChartUpdate = broadcastChartUpdate;
    
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      
      // Initialize Redis cache (non-blocking)
      redisCache.connect().catch(err => {
        console.log('📝 Running without Redis cache - all data will be fetched from database');
      });
      
      // Log WebSocket status
      console.log('📡 WebSocket server ready for real-time updates');
    });
    
    // Initialize chart aggregator
    initChartAggregator();
    
    // Initialize scheduled email jobs
    initializeScheduledJobs();
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    throw error;
  }
};

// Start the initialization process
initializeServer();
