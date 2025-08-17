@echo off
echo 🚀 Setting up Droply project...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create .env file from example
if not exist .env (
    echo 🔧 Creating .env file from env.example...
    copy env.example .env
    echo ⚠️  Please edit .env file with your actual configuration values!
) else (
    echo ✅ .env file already exists
)

REM Create public/favicon.ico placeholder
if not exist public\favicon.ico (
    echo 🎨 Creating favicon placeholder...
    echo # Placeholder for favicon.ico > public\favicon.ico
)

echo.
echo 🎉 Setup complete! Next steps:
echo 1. Edit .env file with your Cloudflare R2 and Upstash Redis credentials
echo 2. Run 'npm run dev' to start development server
echo 3. Visit http://localhost:3000 to see your app
echo.
echo 📚 For deployment instructions, see README.md
pause
