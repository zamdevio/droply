#!/bin/bash

echo "🚀 Setting up Droply project..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created with demo configuration"
    echo "⚠️  The app will run in demo mode without real file storage"
    echo "   To enable real storage, edit .env with your Cloudflare R2 credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Run 'npm run dev' to start development server"
echo "2. Visit http://localhost:3000 to see your app"
echo "3. The app works in demo mode - no real file storage needed!"
echo ""
echo "📚 For production deployment, see DEPLOYMENT.md"
