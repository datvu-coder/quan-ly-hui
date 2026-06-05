# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG VITE_API_SECRET
ENV VITE_API_SECRET=$VITE_API_SECRET
RUN npm run build

# Stage 2: Node.js server (serves static + API)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js .
RUN mkdir -p /data
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.js"]
