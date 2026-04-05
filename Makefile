.PHONY: dev dev-be dev-fe build docker-build docker-up install

# Cài dependencies cả 2
install:
	cd backend && npm install --cache /tmp/npm-cache
	cd frontend && npm install --cache /tmp/npm-cache

# Dev: chạy cả BE và FE song song
dev:
	@echo "Chạy Backend (port 3000) và Frontend (port 5173)..."
	@(cd backend && npm run start:dev) & (cd frontend && npm run dev)

# Dev riêng Backend
dev-be:
	cd backend && npm run start:dev

# Dev riêng Frontend
dev-fe:
	cd frontend && npm run dev

# Build frontend vào backend/public rồi build backend
build:
	cd frontend && npm run build
	cd backend && npm run build

# Docker
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app
