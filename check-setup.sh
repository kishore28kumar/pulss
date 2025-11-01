#!/bin/bash

echo "🔍 Pulss App Setup Validation"
echo "================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    # Check Supabase URL
    if grep -q "VITE_SUPABASE_URL=https://fefwfetsmqbggcujeyug.supabase.co" .env.local; then
        echo "✅ Supabase URL configured"
    else
        echo "❌ Supabase URL missing or incorrect"
    fi
    
    # Check Supabase Key
    if grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env.local; then
        echo "✅ Supabase Anon Key configured"
    else
        echo "❌ Supabase Anon Key missing"
    fi
    
    # Check Super Admin Email
    if grep -q "VITE_DEFAULT_SUPERADMIN_EMAIL=lbalajeesreeshan@gmail.com" .env.local; then
        echo "✅ Super Admin Email configured"
    else
        echo "❌ Super Admin Email missing"
    fi
    
else
    echo "❌ .env.local file missing"
fi

echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed - run 'npm install'"
fi

# Check if schema file exists
if [ -f "supabase/schema.sql" ]; then
    echo "✅ Database schema file exists"
else
    echo "❌ Database schema file missing"
fi

# Check if main files exist
if [ -f "src/App.tsx" ]; then
    echo "✅ Main app files exist"
else
    echo "❌ Main app files missing"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Ensure all items above show ✅"
echo "2. Go to your Supabase dashboard and run the schema.sql"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:5173/health"
echo ""
echo "🚀 Your Pulss app is ready to launch!"