#!/bin/bash

# Pulss Platform - Quick Start Script
# This script sets up the database and starts the backend

set -e

echo "🚀 Pulss Platform - Quick Start"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql"
    echo "  macOS: brew install postgresql"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version must be >= 18.0.0${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Database configuration
read -p "Enter PostgreSQL user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Enter database name [pulssdb]: " DB_NAME
DB_NAME=${DB_NAME:-pulssdb}

read -p "Enter database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "📊 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Test database connection
echo "Testing database connection..."
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo "Please check your credentials and ensure PostgreSQL is running"
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "Creating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME"
echo -e "${GREEN}✓ Database ready${NC}"

# Run migrations
echo ""
echo "Running database migrations..."
cd backend
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/01_init_schema.sql
echo -e "${GREEN}✓ Schema created${NC}"

# Seed data
echo ""
read -p "Load seed data (test accounts and sample data)? [Y/n]: " LOAD_SEED
LOAD_SEED=${LOAD_SEED:-Y}

if [[ $LOAD_SEED =~ ^[Yy]$ ]]; then
    echo "Loading seed data..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed/seed_data.sql
    echo -e "${GREEN}✓ Seed data loaded${NC}"
    echo ""
    echo -e "${YELLOW}Test Credentials:${NC}"
    echo "  Super Admin:"
    echo "    Email: superadmin@pulss.app"
    echo "    Password: Password123!"
    echo ""
    echo "  Tenant Admin (City Care Pharmacy):"
    echo "    Email: admin@citypharmacy.com"
    echo "    Password: Password123!"
    echo ""
    echo "  Customer:"
    echo "    Email: customer1@example.com"
    echo "    Password: Password123!"
fi

# Create .env file
echo ""
echo "Creating .env file..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

cat > .env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Super Admin Configuration
SUPER_ADMIN_EMAIL=superadmin@pulss.app

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF

echo -e "${GREEN}✓ Environment file created${NC}"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Start server
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Starting backend server..."
echo ""
echo "API will be available at: http://localhost:3000"
echo "Health check: http://localhost:3000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
