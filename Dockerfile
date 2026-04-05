# ===== Stage 1: Build Frontend =====
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --cache /tmp/npm-cache
COPY frontend/ ./
RUN npm run build
# Output: /app/frontend/dist (vite.config.ts đã set outDir = ../backend/public)
# Nhưng trong Docker context, ta copy thủ công

# ===== Stage 2: Build Backend =====
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --cache /tmp/npm-cache
COPY backend/ ./
# Copy frontend build vào backend/public
COPY --from=frontend-builder /app/frontend/dist ./public
RUN npm run build

# ===== Stage 3: Production =====
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Chỉ copy những gì cần cho production
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/public ./public
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
