# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci

# Build client
COPY client ./client
RUN npm run build --workspace=client

# Build server (transpile TS → JS)
COPY server ./server
RUN cd server && npx tsc

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app

# Only copy what's needed to run
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/client/dist ./client/dist

# Install only server production deps
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
