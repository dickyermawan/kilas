# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    sqlite-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --network-timeout=100000

# Production stage
FROM node:20-alpine

# Add labels
LABEL maintainer="Dicky Ermawan S <dikywana@gmail.com>"
LABEL description="Kilas - WhatsApp Gateway API with Baileys, Multi-session support, and Dashboard"
LABEL version="1.0.0"

# Install runtime dependencies
RUN apk add --no-cache wget sqlite-libs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -G nodejs nodejs

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Create directories for sessions, media, and database with proper permissions
RUN mkdir -p /app/sessions /app/media /app/media/uploads /app/data /app/public/images && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001


# Start the application
CMD ["node", "server.js"]