# Use highly optimized and secure official Node alpine base image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy dependency manifests first to leverage Docker build cache
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies (including devDependencies needed for build)
RUN npm install

# Copy all application files
COPY . .

# Build the client app with Vite and bundle the server using esbuild
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

# Set production environment
ENV NODE_ENV=production
WORKDIR /app

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy data directory template or let the application create it at runtime
RUN mkdir -p data-store

# Install ONLY production dependencies to keep the final image minimal
RUN npm install --only=production

# Expose port 3000 (standard for this application)
EXPOSE 3000

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(res => res.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Node.js production server
CMD ["npm", "start"]
