#!/bin/sh
# Migration script that handles existing databases gracefully
# Waits for database to be ready before running migrations

cd ../../packages/database

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL environment variable is not set"
  echo "⚠️  Skipping migrations. Please set DATABASE_URL and run migrations manually."
  exit 0
fi

# Function to check database connection using prisma migrate status
check_db_connection() {
  npx prisma migrate status > /dev/null 2>&1
}

# Wait for database to be ready (max 30 attempts, 2 seconds apart = 60 seconds total)
echo "⏳ Waiting for database connection..."
MAX_ATTEMPTS=30
ATTEMPT=0
DB_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if check_db_connection; then
    echo "✅ Database connection established"
    DB_READY=true
    break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS failed. Retrying in 2 seconds..."
    sleep 2
  fi
done

if [ "$DB_READY" = "false" ]; then
  echo "❌ Failed to connect to database after $MAX_ATTEMPTS attempts"
  echo "❌ Please check:"
  echo "   1. Database is running"
  echo "   2. DATABASE_URL is correct"
  echo "   3. Network connectivity"
  echo ""
  echo "⚠️  Continuing anyway - migrations will be retried on next startup"
  exit 0  # Don't fail startup, allow retry
fi

# Generate Prisma Client first (required for migrations)
echo "🔧 Generating Prisma Client..."
npx prisma generate || {
  echo "⚠️  Prisma Client generation failed, but continuing..."
}

# Try to run migrations
echo "🗄️  Running database migrations..."
set +e  # Don't exit on error - we'll handle it manually
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATE_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
  echo "✅ Migrations applied successfully"
  exit 0
fi

# Migration failed - check the reason
if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
  echo "⚠️  Database schema exists. Marking migration as applied..."
  npx prisma migrate resolve --applied 20251105051743_pulss 2>/dev/null || echo "   Migration already resolved"
  exit 0
elif echo "$MIGRATE_OUTPUT" | grep -q "P1001\|Can't reach database\|Connection closed\|Error.*Closed\|kind: Closed"; then
  echo "❌ Database connection error during migration"
  echo "   Error details:"
  echo "$MIGRATE_OUTPUT" | head -10
  echo ""
  echo "⚠️  This might be a transient error. Server will start but migrations may need to be retried."
  exit 0  # Don't fail startup - allow retry
elif echo "$MIGRATE_OUTPUT" | grep -q "already applied\|No pending migrations\|Database.*is up to date"; then
  echo "✅ Migrations already applied"
  exit 0
else
  echo "⚠️  Migration failed with exit code $MIGRATE_EXIT_CODE"
  echo "   Output:"
  echo "$MIGRATE_OUTPUT" | head -10
  echo ""
  echo "⚠️  Server will start anyway. Please check migrations manually if needed."
  exit 0  # Don't fail startup
fi

# Safety net - should never reach here, but just in case
exit 0

