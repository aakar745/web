# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]