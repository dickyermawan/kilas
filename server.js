const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const pino = require('pino');
require('dotenv').config();

// Create logger
const logger = pino({ level: 'info' });

const authMiddleware = require('./src/middleware/auth');
const SessionManager = require('./src/lib/SessionManager');
const WebhookSender = require('./src/lib/WebhookSender');
const Database = require('./src/lib/Database');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Configure CORS from .env
const corsOrigin = process.env.CORS_ORIGIN || '*';
const corsOptions = {
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions
});

// Initialize Webhook Sender
const webhookSender = new WebhookSender(logger);

// Initialize Session Manager with WebhookSender
const sessionManager = new SessionManager(io, logger, webhookSender);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));

// Make components available in request
app.use((req, res, next) => {
    req.io = io;
    req.logger = logger;
    req.sessionManager = sessionManager;
    req.db = database; // Add database to request
    next();
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/sessions', authMiddleware, require('./src/routes/sessions'));
app.use('/api/messages', authMiddleware, require('./src/routes/messages'));
app.use('/api/groups', authMiddleware, require('./src/routes/groups'));
app.use('/api/contacts', authMiddleware, require('./src/routes/contacts'));
app.use('/api/status', authMiddleware, require('./src/routes/status'));
app.use('/api/webhook', authMiddleware, require('./src/routes/webhook'));
app.use('/api/logs', authMiddleware, require('./src/routes/logs'));

// Handle dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Redirect root to dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Socket.IO Connection Handler
const socketHandler = require('./src/websocket/socketHandler');
io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    socketHandler(io, socket);
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Initialize Database and Start server
const PORT = process.env.PORT || 3000;
const database = new Database(logger);

// Start server after database initialization
database.init().then(() => {
    server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Dashboard accessible at http://localhost:${PORT}/dashboard`);
    });

    // Schedule daily cleanup (at midnight)
    const scheduleCleanup = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight - now;

        setTimeout(() => {
            database.cleanup().catch(err => logger.error('Cleanup error:', err));
            setInterval(() => {
                database.cleanup().catch(err => logger.error('Cleanup error:', err));
            }, 24 * 60 * 60 * 1000); // Every 24 hours
        }, msUntilMidnight);
    };
    scheduleCleanup();
}).catch(err => {
    logger.error('Failed to initialize database:', err);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    await database.close();
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});
