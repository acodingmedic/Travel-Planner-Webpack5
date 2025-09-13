// Holonic Travel Planner - Main Server Entry Point
// Advanced orchestration system with holonic architecture

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Import holonic components
const { HolonicOrchestrator } = require('./backend/core/holonic-orchestrator');
const { SystemMonitor } = require('./backend/monitoring/system-monitor');
const { SecurityManager } = require('./backend/security/security-manager');
const { DataManager } = require('./backend/data/data-manager');
const { APIGateway } = require('./backend/api/api-gateway');
const { ConfigManager } = require('./config/config-manager');
const { Logger } = require('./utils/logger');

// Initialize configuration
const config = ConfigManager.getInstance();
const logger = Logger.getInstance();

// Initialize Express application
const app = express();
const PORT = config.get('server.port', 3000);
const NODE_ENV = config.get('app.environment', 'development');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.get('security.rateLimit.windowMs', 15 * 60 * 1000), // 15 minutes
    max: config.get('security.rateLimit.max', 100), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: config.get('cors.allowedOrigins', ['http://localhost:3000', 'http://localhost:8080']),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Initialize holonic system components
class HolonicTravelSystem {
    constructor() {
        this.orchestrator = null;
        this.systemMonitor = null;
        this.securityManager = null;
        this.dataManager = null;
        this.apiGateway = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            logger.info('Initializing Holonic Travel System...');

            // Initialize core components in dependency order
            this.securityManager = new SecurityManager(config);
            await this.securityManager.initialize();

            this.dataManager = new DataManager(config);
            await this.dataManager.initialize();

            this.systemMonitor = new SystemMonitor(config);
            await this.systemMonitor.initialize();

            this.apiGateway = new APIGateway(config, this.securityManager);
            await this.apiGateway.initialize();

            // Initialize the holonic orchestrator
            this.orchestrator = new HolonicOrchestrator({
                securityManager: this.securityManager,
                dataManager: this.dataManager,
                systemMonitor: this.systemMonitor,
                apiGateway: this.apiGateway,
                config: config
            });
            await this.orchestrator.initialize();

            this.isInitialized = true;
            logger.info('Holonic Travel System initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize Holonic Travel System:', error);
            throw error;
        }
    }

    async shutdown() {
        logger.info('Shutting down Holonic Travel System...');
        
        if (this.orchestrator) {
            await this.orchestrator.shutdown();
        }
        if (this.apiGateway) {
            await this.apiGateway.shutdown();
        }
        if (this.systemMonitor) {
            await this.systemMonitor.shutdown();
        }
        if (this.dataManager) {
            await this.dataManager.shutdown();
        }
        if (this.securityManager) {
            await this.securityManager.shutdown();
        }

        logger.info('Holonic Travel System shutdown complete');
    }

    getHealthStatus() {
        if (!this.isInitialized) {
            return { status: 'initializing', components: {} };
        }

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            components: {
                orchestrator: this.orchestrator?.getStatus() || 'unknown',
                security: this.securityManager?.getStatus() || 'unknown',
                data: this.dataManager?.getStatus() || 'unknown',
                monitor: this.systemMonitor?.getStatus() || 'unknown',
                api: this.apiGateway?.getStatus() || 'unknown'
            }
        };
    }
}

// Initialize the holonic system
const holonicSystem = new HolonicTravelSystem();

// Health check endpoint
app.get('/health', (req, res) => {
    const healthStatus = holonicSystem.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
});

// API routes through holonic gateway
app.use('/api', async (req, res, next) => {
    if (!holonicSystem.isInitialized) {
        return res.status(503).json({ error: 'System is initializing, please try again later' });
    }
    
    // Route through the holonic API gateway
    holonicSystem.apiGateway.handleRequest(req, res, next);
});

// Serve React application for all other routes
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Application not built. Please run npm run build first.' });
    }
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    
    if (res.headersSent) {
        return next(error);
    }
    
    const statusCode = error.statusCode || 500;
    const message = NODE_ENV === 'production' ? 'Internal Server Error' : error.message;
    
    res.status(statusCode).json({
        error: message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, starting graceful shutdown...');
    await holonicSystem.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, starting graceful shutdown...');
    await holonicSystem.shutdown();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
async function startServer() {
    try {
        // Initialize the holonic system
        await holonicSystem.initialize();
        
        // Start the HTTP server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Holonic Travel Planner Server running on port ${PORT}`);
            logger.info(`📊 Environment: ${NODE_ENV}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger.info(`🌐 Application: http://localhost:${PORT}`);
        });

        // Configure server timeouts
        server.timeout = config.get('server.timeout', 30000);
        server.keepAliveTimeout = config.get('server.keepAliveTimeout', 5000);
        server.headersTimeout = config.get('server.headersTimeout', 6000);

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { app, holonicSystem, startServer };