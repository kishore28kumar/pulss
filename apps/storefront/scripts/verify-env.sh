#!/bin/sh
# Verify environment variables are set before build
echo "=== Verifying Environment Variables ==="
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-NOT_SET}"
echo "DEPLOY_ENV: ${DEPLOY_ENV:-NOT_SET}"
echo "NEXT_PUBLIC_TENANT_SLUG: ${NEXT_PUBLIC_TENANT_SLUG:-NOT_SET}"
echo "======================================"

if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "WARNING: NEXT_PUBLIC_API_URL is not set!"
  echo "Build will use fallback URL from config/urls.ts"
fi

