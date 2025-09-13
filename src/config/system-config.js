// System Configuration Management
// Holonic Travel Planner - Advanced system configuration with holonic architecture

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { envConfig } = require('./env-config');

/**
 * System Configuration Manager
 * Manages system-wide configuration with holonic principles
 */
class SystemConfig extends EventEmitter {
    constructor() {
        super();
        this.config = new Map();
        this.watchers = new Map();
        this.validators = new Map();
        this.transformers = new Map();
        this.isInitialized = false;
        this.configHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Initialize system configuration
     */
    async initialize() {
        try {
            // Load base configuration
            await this.loadBaseConfiguration();
            
            // Load holonic system configuration
            await this.loadHolonicConfiguration();
            
            // Load feature configurations
            await this.loadFeatureConfigurations();
            
            // Setup configuration validation
            this.setupValidation();
            
            // Setup configuration watchers
            this.setupWatchers();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ System configuration initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize system configuration:', error);
            throw error;
        }
    }

    /**
     * Load base system configuration
     */
    async loadBaseConfiguration() {
        // Server configuration
        this.set('server', {
            port: envConfig.get('PORT', 3000),
            host: envConfig.get('HOST', 'localhost'),
            timeout: envConfig.get('REQUEST_TIMEOUT', 30000),
            keepAliveTimeout: 5000,
            headersTimeout: 6000,
            maxRequestSize: envConfig.get('MAX_REQUEST_SIZE', '10mb'),
            compression: envConfig.get('ENABLE_COMPRESSION', true),
            cors: {
                enabled: true,
                allowedOrigins: [
                    'http://localhost:3000',
                    'http://localhost:8080',
                    'https://holonic-travel.com'
                ],
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            }
        });

        // Database configuration
        this.set('database', {
            host: envConfig.get('DB_HOST', 'localhost'),
            port: envConfig.get('DB_PORT', 5432),
            name: envConfig.get('DB_NAME', 'holonic_travel'),
            user: envConfig.get('DB_USER', 'postgres'),
            password: envConfig.get('DB_PASSWORD', ''),
            ssl: envConfig.get('DB_SSL', false),
            pool: {
                min: 2,
                max: 10,
                acquireTimeoutMillis: 30000,
                createTimeoutMillis: 30000,
                destroyTimeoutMillis: 5000,
                idleTimeoutMillis: 30000,
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 200
            },
            migrations: {
                directory: './src/database/migrations',
                tableName: 'knex_migrations'
            },
            seeds: {
                directory: './src/database/seeds'
            }
        });

        // Redis configuration
        this.set('redis', {
            host: envConfig.get('REDIS_HOST', 'localhost'),
            port: envConfig.get('REDIS_PORT', 6379),
            password: envConfig.get('REDIS_PASSWORD', ''),
            db: 0,
            keyPrefix: 'holonic:',
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });

        // Security configuration
        this.set('security', {
            jwt: {
                secret: envConfig.get('JWT_SECRET'),
                expiresIn: envConfig.get('JWT_EXPIRES_IN', '24h'),
                algorithm: 'HS256',
                issuer: 'holonic-travel-planner',
                audience: 'holonic-travel-users'
            },
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32,
                ivLength: 16,
                tagLength: 16
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // limit each IP to 100 requests per windowMs
                message: 'Too many requests from this IP',
                standardHeaders: true,
                legacyHeaders: false,
                skipSuccessfulRequests: false,
                skipFailedRequests: false
            },
            helmet: {
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
            }
        });

        // Logging configuration
        this.set('logging', {
            level: envConfig.get('LOG_LEVEL', 'info'),
            format: 'combined',
            colorize: envConfig.get('NODE_ENV') === 'development',
            timestamp: true,
            maxFiles: 5,
            maxSize: '10m',
            directory: './logs',
            errorFile: 'error.log',
            combinedFile: 'combined.log',
            exceptionFile: 'exceptions.log'
        });
    }

    /**
     * Load holonic system configuration
     */
    async loadHolonicConfiguration() {
        // Holonic orchestrator configuration
        this.set('holonic', {
            orchestrator: {
                enabled: true,
                maxConcurrentTasks: 10,
                taskTimeout: 30000,
                retryAttempts: 3,
                retryDelay: 1000,
                healthCheckInterval: 30000,
                metricsCollection: true
            },
            agents: {
                search: {
                    enabled: true,
                    maxConcurrentSearches: 5,
                    searchTimeout: 15000,
                    cacheResults: true,
                    cacheTTL: 3600
                },
                booking: {
                    enabled: true,
                    maxConcurrentBookings: 3,
                    bookingTimeout: 60000,
                    confirmationRequired: true,
                    paymentTimeout: 300000
                },
                recommendation: {
                    enabled: true,
                    algorithmType: 'collaborative',
                    maxRecommendations: 10,
                    refreshInterval: 3600000
                },
                notification: {
                    enabled: true,
                    channels: ['email', 'push', 'sms'],
                    retryAttempts: 3,
                    batchSize: 100
                }
            },
            communication: {
                protocol: 'http',
                messageFormat: 'json',
                compression: true,
                encryption: true,
                timeout: 10000
            }
        });

        // System monitoring configuration
        this.set('monitoring', {
            enabled: true,
            metricsInterval: 30000,
            healthCheckInterval: 10000,
            alertThresholds: {
                cpu: 80,
                memory: 85,
                disk: 90,
                responseTime: 5000,
                errorRate: 5
            },
            retention: {
                metrics: '7d',
                logs: '30d',
                traces: '3d'
            }
        });
    }

    /**
     * Load feature-specific configurations
     */
    async loadFeatureConfigurations() {
        // External API configurations
        this.set('apis', {
            amadeus: {
                enabled: !!envConfig.get('AMADEUS_API_KEY'),
                apiKey: envConfig.get('AMADEUS_API_KEY'),
                apiSecret: envConfig.get('AMADEUS_API_SECRET'),
                baseUrl: 'https://api.amadeus.com',
                timeout: 15000,
                retryAttempts: 2
            },
            googleMaps: {
                enabled: !!envConfig.get('GOOGLE_MAPS_API_KEY'),
                apiKey: envConfig.get('GOOGLE_MAPS_API_KEY'),
                baseUrl: 'https://maps.googleapis.com/maps/api',
                timeout: 10000
            },
            stripe: {
                enabled: !!envConfig.get('STRIPE_SECRET_KEY'),
                secretKey: envConfig.get('STRIPE_SECRET_KEY'),
                publishableKey: envConfig.get('STRIPE_PUBLISHABLE_KEY'),
                webhookSecret: envConfig.get('STRIPE_WEBHOOK_SECRET'),
                apiVersion: '2023-10-16'
            }
        });

        // Email configuration
        this.set('email', {
            enabled: !!envConfig.get('SMTP_HOST'),
            smtp: {
                host: envConfig.get('SMTP_HOST'),
                port: envConfig.get('SMTP_PORT', 587),
                secure: envConfig.get('SMTP_PORT', 587) === 465,
                auth: {
                    user: envConfig.get('SMTP_USER'),
                    pass: envConfig.get('SMTP_PASSWORD')
                }
            },
            from: {
                name: 'Holonic Travel Planner',
                address: envConfig.get('SMTP_FROM', 'noreply@holonic-travel.com')
            },
            templates: {
                directory: './src/templates/email',
                engine: 'handlebars'
            }
        });

        // Analytics configuration
        this.set('analytics', {
            enabled: envConfig.get('ENABLE_ANALYTICS', false),
            provider: 'internal',
            apiKey: envConfig.get('ANALYTICS_KEY'),
            trackingId: envConfig.get('ANALYTICS_TRACKING_ID'),
            sampleRate: 1.0,
            anonymizeIp: true,
            respectDnt: true
        });

        // Caching configuration
        this.set('cache', {
            enabled: envConfig.get('ENABLE_CACHING', true),
            defaultTTL: envConfig.get('CACHE_TTL', 3600),
            maxKeys: 10000,
            checkPeriod: 600,
            strategies: {
                search: { ttl: 1800, maxKeys: 1000 },
                user: { ttl: 3600, maxKeys: 5000 },
                static: { ttl: 86400, maxKeys: 500 }
            }
        });

        // GDPR and privacy configuration
        this.set('privacy', {
            gdprCompliance: envConfig.get('GDPR_COMPLIANCE', true),
            dataRetentionDays: envConfig.get('DATA_RETENTION_DAYS', 365),
            cookieConsentRequired: envConfig.get('COOKIE_CONSENT_REQUIRED', true),
            anonymizationEnabled: true,
            rightToErasure: true,
            dataPortability: true,
            consentManagement: {
                version: '1.0',
                categories: ['necessary', 'analytics', 'marketing', 'preferences']
            }
        });
    }

    /**
     * Setup configuration validation
     */
    setupValidation() {
        // Validate server configuration
        this.addValidator('server.port', (value) => {
            return Number.isInteger(value) && value > 0 && value < 65536;
        });

        this.addValidator('server.timeout', (value) => {
            return Number.isInteger(value) && value > 0;
        });

        // Validate database configuration
        this.addValidator('database.host', (value) => {
            return typeof value === 'string' && value.length > 0;
        });

        this.addValidator('database.port', (value) => {
            return Number.isInteger(value) && value > 0 && value < 65536;
        });

        // Validate security configuration
        this.addValidator('security.jwt.secret', (value) => {
            return typeof value === 'string' && value.length >= 32;
        });

        // Validate holonic configuration
        this.addValidator('holonic.orchestrator.maxConcurrentTasks', (value) => {
            return Number.isInteger(value) && value > 0 && value <= 100;
        });
    }

    /**
     * Setup configuration watchers
     */
    setupWatchers() {
        if (envConfig.get('NODE_ENV') === 'development') {
            // Watch for configuration file changes
            const configDir = path.join(process.cwd(), 'config');
            if (fs.existsSync(configDir)) {
                fs.watch(configDir, { recursive: true }, (eventType, filename) => {
                    if (filename && filename.endsWith('.json')) {
                        this.emit('configChanged', { eventType, filename });
                    }
                });
            }
        }
    }

    /**
     * Set configuration value with validation
     */
    set(key, value, options = {}) {
        const { validate = true, transform = true, notify = true } = options;
        
        // Apply transformers
        if (transform && this.transformers.has(key)) {
            value = this.transformers.get(key)(value);
        }
        
        // Validate value
        if (validate && this.validators.has(key)) {
            const validator = this.validators.get(key);
            if (!validator(value)) {
                throw new Error(`Invalid configuration value for key: ${key}`);
            }
        }
        
        // Store previous value for history
        const previousValue = this.config.get(key);
        
        // Set new value
        this.config.set(key, value);
        
        // Add to history
        this.addToHistory(key, previousValue, value);
        
        // Emit change event
        if (notify && this.isInitialized) {
            this.emit('configChanged', { key, previousValue, newValue: value });
        }
        
        return this;
    }

    /**
     * Get configuration value with dot notation support
     */
    get(key, defaultValue = undefined) {
        if (key.includes('.')) {
            return this.getNestedValue(key, defaultValue);
        }
        
        return this.config.has(key) ? this.config.get(key) : defaultValue;
    }

    /**
     * Get nested configuration value
     */
    getNestedValue(key, defaultValue) {
        const keys = key.split('.');
        let value = this.config.get(keys[0]);
        
        for (let i = 1; i < keys.length; i++) {
            if (value && typeof value === 'object' && keys[i] in value) {
                value = value[keys[i]];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Check if configuration key exists
     */
    has(key) {
        if (key.includes('.')) {
            return this.getNestedValue(key) !== undefined;
        }
        
        return this.config.has(key);
    }

    /**
     * Add configuration validator
     */
    addValidator(key, validator) {
        this.validators.set(key, validator);
        return this;
    }

    /**
     * Add configuration transformer
     */
    addTransformer(key, transformer) {
        this.transformers.set(key, transformer);
        return this;
    }

    /**
     * Add configuration watcher
     */
    addWatcher(key, callback) {
        if (!this.watchers.has(key)) {
            this.watchers.set(key, new Set());
        }
        
        this.watchers.get(key).add(callback);
        
        // Return unwatch function
        return () => {
            const watchers = this.watchers.get(key);
            if (watchers) {
                watchers.delete(callback);
                if (watchers.size === 0) {
                    this.watchers.delete(key);
                }
            }
        };
    }

    /**
     * Add to configuration history
     */
    addToHistory(key, previousValue, newValue) {
        this.configHistory.push({
            timestamp: new Date(),
            key,
            previousValue,
            newValue
        });
        
        // Limit history size
        if (this.configHistory.length > this.maxHistorySize) {
            this.configHistory.shift();
        }
    }

    /**
     * Get configuration history
     */
    getHistory(key = null) {
        if (key) {
            return this.configHistory.filter(entry => entry.key === key);
        }
        
        return [...this.configHistory];
    }

    /**
     * Export configuration as object
     */
    toObject() {
        const result = {};
        
        for (const [key, value] of this.config.entries()) {
            result[key] = value;
        }
        
        return result;
    }

    /**
     * Validate all configuration
     */
    validate() {
        const errors = [];
        
        for (const [key, validator] of this.validators.entries()) {
            const value = this.get(key);
            if (value !== undefined && !validator(value)) {
                errors.push(`Invalid value for configuration key: ${key}`);
            }
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        return true;
    }

    /**
     * Reset configuration to defaults
     */
    async reset() {
        this.config.clear();
        this.configHistory = [];
        await this.initialize();
        this.emit('reset');
    }

    /**
     * Get configuration summary for debugging
     */
    getSummary() {
        return {
            totalKeys: this.config.size,
            validators: this.validators.size,
            transformers: this.transformers.size,
            watchers: this.watchers.size,
            historyEntries: this.configHistory.length,
            isInitialized: this.isInitialized
        };
    }
}

// Create singleton instance
const systemConfig = new SystemConfig();

// Export both the instance and class
module.exports = {
    SystemConfig,
    systemConfig,
    // Convenience methods
    get: (key, defaultValue) => systemConfig.get(key, defaultValue),
    set: (key, value, options) => systemConfig.set(key, value, options),
    has: (key) => systemConfig.has(key),
    initialize: () => systemConfig.initialize(),
    validate: () => systemConfig.validate(),
    toObject: () => systemConfig.toObject()
};