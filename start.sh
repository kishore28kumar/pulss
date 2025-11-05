#!/bin/bash

echo "🚀 Starting Pulss E-Commerce Platform..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start Docker containers
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
docker-compose exec -T backend sh -c "cd /app/packages/database && npx prisma generate" || {
    echo "⚠️  Prisma generate failed, retrying..."
    sleep 3
    docker-compose exec -T backend sh -c "cd /app/packages/database && npx prisma generate"
}

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend sh -c "cd /app/packages/database && npx prisma migrate dev --name init" || {
    echo "⚠️  Migrations already applied or failed"
}

# Seed the database
echo "🌱 Seeding database with sample data..."
docker-compose exec -T backend sh -c "cd /app/packages/database && npm run seed" || {
    echo "⚠️  Database already seeded or seed failed"
}

# Restart backend to ensure it's working
echo "🔄 Restarting backend..."
docker-compose restart backend

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Your applications are now running:"
echo "   🌐 Storefront:       http://localhost:3000"
echo "   👨‍💼 Admin Dashboard:  http://localhost:3001"
echo "   🔌 Backend API:      http://localhost:5000"
echo ""
echo "🎯 Default tenant slug: 'default'"
echo ""
echo "💡 To stop all services, run: npm run stop"
echo "📊 To view logs, run: npm run logs"
echo ""

