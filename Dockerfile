# Multi-stage build for optimal image size

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install OpenSSL (required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy prisma schema for generation
COPY prisma ./prisma/

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install OpenSSL, Liquibase (for migrations) and bash
RUN apk add --no-cache bash openssl openjdk11-jre-headless curl && \
    curl -L https://github.com/liquibase/liquibase/releases/download/v4.24.0/liquibase-4.24.0.tar.gz | tar xzf - -C /opt && \
    ln -s /opt/liquibase /usr/local/bin/liquibase

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy Prisma schema and db migrations
COPY prisma ./prisma/
COPY db ./db/

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main"]
