# Stage 1: Build Frontend and Server Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Install all dependencies (including devDependencies required for build)
RUN npm install

# Copy application source code
COPY . .

# Build Vite client SPA (to /app/dist) and bundled server (to /app/dist/server.cjs)
RUN npm run build

# Stage 2: Production Minimal Container Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production-only dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built production assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=builder /app/firebase-blueprint.json ./firebase-blueprint.json
COPY --from=builder /app/public ./public

# Expose port (Cloud Run passes dynamic $PORT at runtime, defaults to 3000/8080)
EXPOSE 3000

# Run compiled CommonJS server directly
CMD ["node", "dist/server.cjs"]
