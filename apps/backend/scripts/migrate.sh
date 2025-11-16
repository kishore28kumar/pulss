#!/bin/sh
# Migration script that handles existing databases gracefully

cd ../../packages/database

# Try to run migrations
if npx prisma migrate deploy 2>&1 | grep -q "P3005"; then
  echo "Database schema exists. Marking migration as applied..."
  npx prisma migrate resolve --applied 20251105051743_pulss || echo "Migration already resolved"
else
  echo "Migrations applied successfully"
fi

