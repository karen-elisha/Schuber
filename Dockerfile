# ─── backend/Dockerfile ───────────────────────────────────────
# Multi-stage: build → slim production image

# Stage 1 — deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2 — final image
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup -S schuber && adduser -S schuber -G schuber

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json .

USER schuber

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "src/index.js"]
