require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const logger = require('./utils/logger');
const { startDataRefresher } = require('./services/dataRefresher');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000','http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(compression());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000','http://localhost:8080'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

const yieldNS = io.of('/yields');

yieldNS.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    socket.on('subscribe', (poolAddresses) => {
        if (Array.isArray(poolAddresses)) {
            poolAddresses.forEach(addr => socket.join(`pool:${addr}`));
            logger.info('Client subscribed to pools', {
                socketId: socket.id,
                pools: poolAddresses
            });
        }
    });

    socket.on('unsubscribe', (poolAddresses) => {
        if (Array.isArray(poolAddresses)) {
            poolAddresses.forEach(addr => socket.leave(`pool:${addr}`));
        }
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
    });
});

// Make io available to routes
app.set('io', yieldNS);

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    const { DISCOVERY } = require('./config/constants');
    if (DISCOVERY.ENABLED && DISCOVERY.ON_STARTUP) {
        try {
            const { discoverPriorityStablecoinPools } = require('./services/poolDiscovery');
            logger.info('🔍 Running pool discovery on startup...');
            const result = await discoverPriorityStablecoinPools();
            logger.info('🎉 Pool discovery summary:', result);
        } catch (error) {
            logger.error('Pool discovery failed on startup:', error);
            // Don't crash server if discovery fails
        }
    }

    // Start background data refresh worker
    startDataRefresher(yieldNS);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

module.exports = { io, yieldNS };