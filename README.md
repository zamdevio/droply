# README.md

> **Droply** — Anonymous file sharing, no strings attached.
>
> UI on Vercel. Storage on Cloudflare R2 (10GB free).
>
> **🚀 Now with Next.js App Router!**

## Features (MVP)
- Drag & drop upload (no auth)
- Shareable links: `/download/:id`, `/delete/:id`, `/edit/:id`
- Metadata stored per file (JSON)
- Auto‑cleanup: if new upload would exceed the 9GB budget, delete oldest files until it fits
- API input/response validation (zod)
- **Demo mode** - works immediately without setup!

## Tech
- **Next.js 14+ (App Router)** ✅
- TypeScript
- Cloudflare R2 (S3‑compatible)
- zod for schemas
- Tailwind CSS

---

## 🚀 Quick Start (Demo Mode)

The app works immediately in demo mode - no setup required!

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Visit http://localhost:3000
```

**Demo mode features:**
- ✅ File upload simulation
- ✅ Download simulation  
- ✅ Delete simulation
- ✅ Edit metadata simulation
- ✅ All UI functionality works
- ✅ No external services needed

---

## Folder Structure (App Router)
```
 droply/
 ├─ .github/workflows/ci.yml
 ├─ public/
 ├─ src/
 │  ├─ app/                        # App Router
 │  │  ├─ layout.tsx              # Root layout
 │  │  ├─ page.tsx                # Home page
 │  │  ├─ download/[id]/          # Download page
 │  │  ├─ delete/[id]/            # Delete page
 │  │  ├─ edit/[id]/              # Edit page
 │  │  └─ api/                    # API routes
 │  │     ├─ upload/route.ts      # Upload API
 │  │     ├─ download/[id]/       # Download API
 │  │     ├─ delete/[id]/         # Delete API
 │  │     └─ edit/[id]/           # Edit API
 │  ├─ middleware.ts
 │  ├─ lib/
 │  │  ├─ env.ts                  # Environment config
 │  │  ├─ r2.ts                   # R2 client + helpers
 │  │  ├─ id.ts                   # ID generation
 │  │  └─ schemas.ts              # Zod validation
 │  └─ styles/globals.css
 ├─ setup.sh                      # Linux/Mac setup
 ├─ setup.bat                     # Windows setup
 ├─ DEPLOYMENT.md                 # Production guide
 └─ README.md (this file)
```

---

## Environment (.env)

**For Demo Mode (Default):**
```
# Leave empty for demo mode
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=droply
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_BYTES=104857600
ALLOWED_MIME_PREFIXES=image/,application/pdf,video/
```

**For Production:**
```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=droply
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
MAX_FILE_BYTES=104857600
ALLOWED_MIME_PREFIXES=image/,application/pdf,video/
```

---

## 🎯 What's New in App Router Version

1. **Modern Next.js Architecture** - Uses the latest App Router
2. **Demo Mode** - Works immediately without external services
3. **Simplified Setup** - No Redis or complex configuration needed
4. **Better Performance** - App Router optimizations
5. **Cleaner Code** - Modern React patterns and hooks

---

## Git & GitHub quick start
```bash
# 1) create repo locally
mkdir droply && cd droply
# (paste this project content here)
git init -b main
cp env.example .env
# .env is ready for demo mode!

# 2) first commit
git add .
git commit -m "feat: Droply with App Router + demo mode"

# 3) create GitHub repo then push
git remote add origin git@github.com:<you>/droply.git
git push -u origin main

# 4) Vercel deploy (optional)
# - Import the repo on vercel.com
# - Add env vars from .env for production
```

---

## 🚀 Production Deployment

When you're ready for production:

1. **Get Cloudflare R2 credentials** (see DEPLOYMENT.md)
2. **Update .env** with real credentials
3. **Deploy to Vercel** following DEPLOYMENT.md

The app automatically switches from demo mode to production mode when real credentials are provided.

---

### What's Ready Now ✅

- ✅ **App Router** implementation
- ✅ **Demo mode** - works immediately
- ✅ **File upload** simulation
- ✅ **Download/Delete/Edit** simulation
- ✅ **Modern UI** with Tailwind CSS
- ✅ **TypeScript** throughout
- ✅ **Production ready** when credentials added

— Ready to run! 🎉 —
