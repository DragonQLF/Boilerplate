# Stage 1 — base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Stage 2 — development
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Stage 3 — build
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Stage 4 — production (Next.js standalone)
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER appuser
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
