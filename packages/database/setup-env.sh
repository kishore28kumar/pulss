#!/bin/bash

# Setup .env file for Prisma
# This script creates a .env file in packages/database/ with DATABASE_URL

ENV_FILE=".env"

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo ".env file already exists in packages/database/"
    echo "Current DATABASE_URL:"
    grep DATABASE_URL "$ENV_FILE" || echo "DATABASE_URL not found in .env"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Default DATABASE_URL (Docker Compose)
DEFAULT_DB_URL="postgresql://postgres:postgres@localhost:5433/pulss_db?schema=public"

# Ask user for DATABASE_URL
echo "Enter DATABASE_URL (press Enter for default: $DEFAULT_DB_URL)"
read -r DB_URL

if [ -z "$DB_URL" ]; then
    DB_URL="$DEFAULT_DB_URL"
fi

# Create .env file
echo "DATABASE_URL=\"$DB_URL\"" > "$ENV_FILE"

echo ""
echo "✅ Created .env file with:"
echo "DATABASE_URL=\"$DB_URL\""
echo ""
echo "You can now run: npx prisma migrate dev"

