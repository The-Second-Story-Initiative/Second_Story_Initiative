# Dockerfile for Second Story Initiative API Server
# Multi-stage build for production optimization

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript and Vite frontend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiserver

# Copy built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R apiserver:nodejs /app
USER apiserver

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the API server
CMD ["node", "dist/api/server.js"]
