#!/bin/bash

echo "🚀 Setting up Droply project..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file from example
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values!"
else
    echo "✅ .env file already exists"
fi

# Create public/favicon.ico placeholder
if [ ! -f public/favicon.ico ] || [ -s public/favicon.ico ]; then
    echo "🎨 Creating favicon placeholder..."
    echo "# Placeholder for favicon.ico" > public/favicon.ico
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Edit .env file with your Cloudflare R2 and Upstash Redis credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000 to see your app"
echo ""
echo "📚 For deployment instructions, see README.md"
