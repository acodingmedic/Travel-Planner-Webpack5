// Environment Configuration Management
// Holonic Travel Planner - Secure configuration with validation and encryption

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Environment Configuration Manager
 * Handles secure loading, validation, and management of environment variables
 */
class EnvironmentConfig {
    constructor() {
        this.config = new Map();
        this.encryptedKeys = new Set();
        this.requiredKeys = new Set();
        this.validators = new Map();
        this.isInitialized = false;
        this.encryptionKey = null;
    }

    /**
     * Initialize the configuration system
     */
    async initialize() {
        try {
            // Load environment variables
            this.loadEnvironmentVariables();
            
            // Set up encryption if needed
            await this.initializeEncryption();
            
            // Load configuration files
            await this.loadConfigurationFiles();
            
            // Validate required configuration
            this.validateConfiguration();
            
            // Set up configuration watchers in development
            if (this.get('NODE_ENV') === 'development') {
                this.setupConfigurationWatchers();
            }
            
            this.isInitialized = true;
            console.log('✅ Environment configuration initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize environment configuration:', error);
            throw error;
        }
    }

    /**
     * Load environment variables from process.env
     */
    loadEnvironmentVariables() {
        // Core application settings
        this.set('NODE_ENV', process.env.NODE_ENV || 'development');
        this.set('PORT', parseInt(process.env.PORT) || 3000);
        this.set('HOST', process.env.HOST || 'localhost');
        
        // Database configuration
        this.set('DB_HOST', process.env.DB_HOST || 'localhost');
        this.set('DB_PORT', parseInt(process.env.DB_PORT) || 5432);
        this.set('DB_NAME', process.env.DB_NAME || 'holonic_travel');
        this.set('DB_USER', process.env.DB_USER || 'postgres');
        this.set('DB_PASSWORD', process.env.DB_PASSWORD || '', true); // encrypted
        this.set('DB_SSL', process.env.DB_SSL === 'true');
        
        // Redis configuration
        this.set('REDIS_HOST', process.env.REDIS_HOST || 'localhost');
        this.set('REDIS_PORT', parseInt(process.env.REDIS_PORT) || 6379);
        this.set('REDIS_PASSWORD', process.env.REDIS_PASSWORD || '', true); // encrypted
        
        // JWT and security
        this.set('JWT_SECRET', process.env.JWT_SECRET || this.generateSecureKey(), true); // encrypted
        this.set('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN || '24h');
        this.set('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY || this.generateSecureKey(), true); // encrypted
        
        // External API keys
        this.set('AMADEUS_API_KEY', process.env.AMADEUS_API_KEY || '', true); // encrypted
        this.set('AMADEUS_API_SECRET', process.env.AMADEUS_API_SECRET || '', true); // encrypted
        this.set('GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY || '', true); // encrypted
        this.set('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY || '', true); // encrypted
        this.set('STRIPE_PUBLISHABLE_KEY', process.env.STRIPE_PUBLISHABLE_KEY || '');
        
        // Email configuration
        this.set('SMTP_HOST', process.env.SMTP_HOST || 'localhost');
        this.set('SMTP_PORT', parseInt(process.env.SMTP_PORT) || 587);
        this.set('SMTP_USER', process.env.SMTP_USER || '');
        this.set('SMTP_PASSWORD', process.env.SMTP_PASSWORD || '', true); // encrypted
        
        // Monitoring and logging
        this.set('LOG_LEVEL', process.env.LOG_LEVEL || 'info');
        this.set('SENTRY_DSN', process.env.SENTRY_DSN || '');
        this.set('ANALYTICS_KEY', process.env.ANALYTICS_KEY || '', true); // encrypted
        
        // Feature flags
        this.set('ENABLE_ANALYTICS', process.env.ENABLE_ANALYTICS === 'true');
        this.set('ENABLE_CACHING', process.env.ENABLE_CACHING !== 'false');
        this.set('ENABLE_RATE_LIMITING', process.env.ENABLE_RATE_LIMITING !== 'false');
        this.set('ENABLE_COMPRESSION', process.env.ENABLE_COMPRESSION !== 'false');
        
        // GDPR and privacy
        this.set('GDPR_COMPLIANCE', process.env.GDPR_COMPLIANCE !== 'false');
        this.set('DATA_RETENTION_DAYS', parseInt(process.env.DATA_RETENTION_DAYS) || 365);
        this.set('COOKIE_CONSENT_REQUIRED', process.env.COOKIE_CONSENT_REQUIRED !== 'false');
        
        // Performance settings
        this.set('MAX_REQUEST_SIZE', process.env.MAX_REQUEST_SIZE || '10mb');
        this.set('REQUEST_TIMEOUT', parseInt(process.env.REQUEST_TIMEOUT) || 30000);
        this.set('CACHE_TTL', parseInt(process.env.CACHE_TTL) || 3600);
    }

    /**
     * Initialize encryption for sensitive configuration values
     */
    async initializeEncryption() {
        const keyPath = path.join(process.cwd(), '.encryption-key');
        
        try {
            if (fs.existsSync(keyPath)) {
                this.encryptionKey = fs.readFileSync(keyPath, 'utf8').trim();
            } else {
                // Generate new encryption key
                this.encryptionKey = crypto.randomBytes(32).toString('hex');
                
                // Save key securely (in production, use proper key management)
                if (this.get('NODE_ENV') !== 'production') {
                    fs.writeFileSync(keyPath, this.encryptionKey, { mode: 0o600 });
                }
            }
        } catch (error) {
            console.warn('Warning: Could not initialize encryption:', error.message);
            this.encryptionKey = crypto.randomBytes(32).toString('hex');
        }
    }

    /**
     * Load additional configuration from files
     */
    async loadConfigurationFiles() {
        const configDir = path.join(process.cwd(), 'config');
        const environment = this.get('NODE_ENV');
        
        const configFiles = [
            path.join(configDir, 'default.json'),
            path.join(configDir, `${environment}.json`),
            path.join(configDir, 'local.json')
        ];
        
        for (const configFile of configFiles) {
            if (fs.existsSync(configFile)) {
                try {
                    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                    this.mergeConfiguration(config);
                } catch (error) {
                    console.warn(`Warning: Could not load config file ${configFile}:`, error.message);
                }
            }
        }
    }

    /**
     * Merge configuration object into current config
     */
    mergeConfiguration(config, prefix = '') {
        for (const [key, value] of Object.entries(config)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.mergeConfiguration(value, fullKey);
            } else {
                this.set(fullKey, value);
            }
        }
    }

    /**
     * Set configuration value with optional encryption
     */
    set(key, value, encrypt = false) {
        if (encrypt && value && this.encryptionKey) {
            value = this.encrypt(value.toString());
            this.encryptedKeys.add(key);
        }
        
        this.config.set(key, value);
    }

    /**
     * Get configuration value with automatic decryption
     */
    get(key, defaultValue = undefined) {
        let value = this.config.get(key);
        
        if (value === undefined) {
            return defaultValue;
        }
        
        if (this.encryptedKeys.has(key) && this.encryptionKey) {
            try {
                value = this.decrypt(value);
            } catch (error) {
                console.warn(`Warning: Could not decrypt config value for ${key}`);
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Check if configuration key exists
     */
    has(key) {
        return this.config.has(key);
    }

    /**
     * Mark configuration key as required
     */
    require(key, validator = null) {
        this.requiredKeys.add(key);
        if (validator) {
            this.validators.set(key, validator);
        }
        return this;
    }

    /**
     * Validate all required configuration
     */
    validateConfiguration() {
        const missingKeys = [];
        const invalidKeys = [];
        
        for (const key of this.requiredKeys) {
            const value = this.get(key);
            
            if (value === undefined || value === null || value === '') {
                missingKeys.push(key);
                continue;
            }
            
            const validator = this.validators.get(key);
            if (validator && !validator(value)) {
                invalidKeys.push(key);
            }
        }
        
        if (missingKeys.length > 0) {
            throw new Error(`Missing required configuration keys: ${missingKeys.join(', ')}`);
        }
        
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid configuration values for keys: ${invalidKeys.join(', ')}`);
        }
    }

    /**
     * Encrypt sensitive value
     */
    encrypt(text) {
        if (!this.encryptionKey) return text;
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt sensitive value
     */
    decrypt(encryptedText) {
        if (!this.encryptionKey) return encryptedText;
        
        const parts = encryptedText.split(':');
        if (parts.length !== 2) return encryptedText;
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Generate secure random key
     */
    generateSecureKey(length = 64) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Setup configuration file watchers for development
     */
    setupConfigurationWatchers() {
        const configDir = path.join(process.cwd(), 'config');
        
        if (fs.existsSync(configDir)) {
            fs.watch(configDir, (eventType, filename) => {
                if (filename && filename.endsWith('.json')) {
                    console.log(`Configuration file ${filename} changed, reloading...`);
                    this.loadConfigurationFiles();
                }
            });
        }
    }

    /**
     * Get all configuration as object (excluding encrypted values)
     */
    toObject(includeEncrypted = false) {
        const result = {};
        
        for (const [key, value] of this.config.entries()) {
            if (!includeEncrypted && this.encryptedKeys.has(key)) {
                result[key] = '[ENCRYPTED]';
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }

    /**
     * Export configuration for debugging (safe)
     */
    debug() {
        console.log('Environment Configuration:');
        console.log(JSON.stringify(this.toObject(false), null, 2));
    }
}

// Create singleton instance
const envConfig = new EnvironmentConfig();

// Export both the instance and class
module.exports = {
    EnvironmentConfig,
    envConfig,
    // Convenience methods
    get: (key, defaultValue) => envConfig.get(key, defaultValue),
    set: (key, value, encrypt) => envConfig.set(key, value, encrypt),
    has: (key) => envConfig.has(key),
    require: (key, validator) => envConfig.require(key, validator),
    initialize: () => envConfig.initialize(),
    toObject: (includeEncrypted) => envConfig.toObject(includeEncrypted)
};