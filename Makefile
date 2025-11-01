.PHONY: help setup install dev build test lint format clean backend-dev backend-setup all-setup validate

# Default target - show help
help:
	@echo "Pulss White-Label Platform - Developer Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make setup          - Complete project setup (frontend + backend)"
	@echo "  make install        - Install all dependencies"
	@echo "  make backend-setup  - Setup backend only"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev            - Start frontend development server"
	@echo "  make backend-dev    - Start backend development server"
	@echo "  make build          - Build frontend for production"
	@echo ""
	@echo "Code Quality Commands:"
	@echo "  make lint           - Run linters (ESLint + Stylelint)"
	@echo "  make lint-fix       - Fix linting issues automatically"
	@echo "  make format         - Format code with Prettier"
	@echo "  make format-check   - Check code formatting"
	@echo "  make validate       - Run all checks (type-check, lint, format)"
	@echo "  make test           - Run all tests"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean          - Remove node_modules and build artifacts"
	@echo "  make hooks          - Setup Git hooks with Husky"

# Setup
setup: install hooks
	@echo "✅ Project setup complete!"

install:
	@echo "📦 Installing frontend dependencies..."
	npm install
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "✅ Dependencies installed!"

hooks:
	@echo "🪝 Setting up Git hooks..."
	npx husky install
	@echo "✅ Git hooks configured!"

backend-setup:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "✅ Backend setup complete!"

# Development
dev:
	@echo "🚀 Starting frontend development server..."
	npm run dev

backend-dev:
	@echo "🚀 Starting backend development server..."
	cd backend && npm run dev

build:
	@echo "🏗️  Building frontend for production..."
	npm run build

# Code Quality
lint:
	@echo "🔍 Running linters..."
	npm run lint
	npm run style
	@echo "🔍 Running backend linter..."
	cd backend && npm run lint

lint-fix:
	@echo "🔧 Fixing lint issues..."
	npm run lint:fix
	npm run style:fix
	cd backend && npm run lint:fix

format:
	@echo "✨ Formatting code..."
	npm run format
	cd backend && npm run format

format-check:
	@echo "🔍 Checking code formatting..."
	npm run format:check
	cd backend && npm run format:check

validate:
	@echo "✅ Running all validations..."
	npm run validate
	cd backend && npm run validate

test:
	@echo "🧪 Running tests..."
	@echo "⚠️  No tests configured yet"
	# npm test
	# cd backend && npm test

# Utility
clean:
	@echo "🧹 Cleaning build artifacts and dependencies..."
	rm -rf node_modules dist build
	rm -rf backend/node_modules
	@echo "✅ Clean complete!"
