
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');


const config = require('./config');
const { connectDatabase } = require('./config/database');
const { errorHandler } = require('./core/middlewares/error');
const { apiLimiter, authLimiter } = require('./core/middlewares/ratelimit');
const logger = require('./core/utils/logger');
const scheduler = require('./jobs/scheduler');
const { initializeSocket } = require('./config/socket');


const apiRoutes = require('./routes/index');


const app = express();


const server = http.createServer(app);


app.set('trust proxy', 1);


app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));


app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use(compression());


if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}


app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});


app.use('/api', apiRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});


app.use(errorHandler);


const PORT = process.env.PORT || 8000;


const startServer = async () => {
  try {
    await connectDatabase();
    
    
    scheduler.init();
    logger.info('✅ Scheduled jobs initialized');
    
    
    initializeSocket(server);
    logger.info('✅ Socket.IO initialized');
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Documentation: http://localhost:${PORT}/api`);
      logger.info(`🔌 Socket.IO ready for connections`);
    });
    
    
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      scheduler.stop();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
