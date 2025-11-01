#!/bin/bash

# Pulss Platform - Docker Quick Start
# Start the entire platform with Docker Compose

set -e

echo "🐳 Pulss Platform - Docker Quick Start"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✓ Docker check passed${NC}"
echo ""

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose down 2>/dev/null || true
echo ""

# Build and start services
echo "Building and starting services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up --build -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check if database is ready
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    RETRY=$((RETRY+1))
    echo -n "."
    sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ Database failed to start${NC}"
    docker-compose logs db
    exit 1
fi

# Wait for API to be ready
echo ""
echo "Waiting for API to be ready..."
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    RETRY=$((RETRY+1))
    echo -n "."
    sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ API failed to start${NC}"
    docker-compose logs api
    exit 1
fi

# Load seed data
echo ""
read -p "Load seed data (test accounts and sample data)? [Y/n]: " LOAD_SEED
LOAD_SEED=${LOAD_SEED:-Y}

if [[ $LOAD_SEED =~ ^[Yy]$ ]]; then
    echo "Loading seed data..."
    docker-compose exec -T db psql -U postgres -d pulssdb < backend/seed/seed_data.sql
    echo -e "${GREEN}✓ Seed data loaded${NC}"
fi

# Display summary
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Platform Started Successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📊 Services:"
echo "  🔹 Backend API:    http://localhost:3000"
echo "  🔹 Health Check:   http://localhost:3000/health"
echo "  🔹 PostgreSQL:     localhost:5432"
echo "  🔹 pgAdmin:        http://localhost:5050"
echo "  🔹 n8n:            http://localhost:5678"
echo ""

if [[ $LOAD_SEED =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔑 Test Credentials:${NC}"
    echo ""
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
    echo ""
    echo "  pgAdmin:"
    echo "    Email: admin@pulss.app"
    echo "    Password: admin123"
    echo ""
    echo "  n8n:"
    echo "    Username: admin"
    echo "    Password: admin123"
    echo ""
fi

echo "📝 Useful Commands:"
echo "  View logs:        docker-compose logs -f [service]"
echo "  Stop platform:    docker-compose down"
echo "  Restart service:  docker-compose restart [service]"
echo "  Access DB:        docker-compose exec db psql -U postgres -d pulssdb"
echo ""
echo "Press Ctrl+C to stop following logs..."
echo ""

# Follow logs
docker-compose logs -f
