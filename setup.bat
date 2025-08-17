@echo off
echo 🚀 Setting up Droply project...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create .env file from example if it doesn't exist
if not exist .env (
    echo 🔧 Creating .env file from env.example...
    copy env.example .env
    echo ✅ .env file created with demo configuration
    echo ⚠️  The app will run in demo mode without real file storage
    echo    To enable real storage, edit .env with your Cloudflare R2 credentials
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎉 Setup complete! Next steps:
echo 1. Run 'npm run dev' to start development server
echo 2. Visit http://localhost:3000 to see your app
echo 3. The app works in demo mode - no real file storage needed!
echo.
echo 📚 For production deployment, see DEPLOYMENT.md
pause
