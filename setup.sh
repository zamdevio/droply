#!/bin/bash

echo "🚀 Setting up Droply - Battle-Ready File Sharing"
echo "=================================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Create .env file from example
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: You need to configure your environment variables:"
    echo "   1. Set DATABASE_URL for PostgreSQL connection"
    echo "   2. Set R2 credentials for Cloudflare R2 storage"
    echo ""
    echo "   For demo mode, you can leave them empty and the app will work"
    echo "   with simulated file operations."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Configure your .env file (optional for demo mode)"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000 to see your app"
echo ""
echo "📚 For production deployment:"
echo "   - Set up PostgreSQL database"
echo "   - Configure Cloudflare R2 credentials"
echo "   - Run 'npm run db:migrate' to create database tables"
echo ""
echo "🔍 Demo mode features:"
echo "   - ✅ File upload simulation"
echo "   - ✅ Download simulation"
echo "   - ✅ Delete simulation"
echo "   - ✅ Password protection simulation"
echo "   - ✅ All UI functionality works"
echo "   - ✅ No external services needed"
