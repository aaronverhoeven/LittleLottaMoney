FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install

# Build client
COPY client ./client
RUN npm run build --workspace=client

# Build server
COPY server ./server
RUN npm run build --workspace=server

# Production image
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/client/dist ./client/dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server/node_modules ./server/node_modules

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
