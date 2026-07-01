# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverage caching)
COPY package*.json ./
RUN npm ci

# Copy sources and build standalone server
COPY . .
# Disable Next telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app components from builder
# Next.js standalone includes only files needed for deployment
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
