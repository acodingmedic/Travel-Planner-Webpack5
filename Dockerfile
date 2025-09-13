# Multi-stage Dockerfile for Holonic Travel Planner
# Optimized for production deployment with security best practices

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S holonic -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=holonic:nodejs /app/dist ./dist
COPY --from=builder --chown=holonic:nodejs /app/src ./src
COPY --from=builder --chown=holonic:nodejs /app/config ./config

# Copy additional files
COPY --chown=holonic:nodejs README.md ./
COPY --chown=holonic:nodejs SECURITY.md ./

# Create necessary directories
RUN mkdir -p logs temp uploads && \
    chown -R holonic:nodejs logs temp uploads

# Set security headers and permissions
RUN chmod -R 755 /app && \
    chmod -R 700 /app/config && \
    chmod -R 755 /app/dist

# Switch to non-root user
USER holonic

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "src/index.js"]