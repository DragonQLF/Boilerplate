# Stage 1 — base
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./

# Stage 2 — development
FROM base AS development
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

# Stage 3 — build
FROM base AS build
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# Stage 4 — production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl && addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
USER appuser
EXPOSE 4000
# Run pending migrations then start the server.
# migrate deploy is idempotent — safe to run on every container start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
