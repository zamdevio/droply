# README.md

> **Droply** — Anonymous file sharing, no strings attached.
>
> UI on Vercel. Storage on Cloudflare R2 (10GB free).
>
> Security: Zod validation + IP rate limit (100 req / 60s). If abused, 30‑min cooldown.

## Features (MVP)
- Drag & drop upload (no auth)
- Shareable links: `/download/:id`, `/delete/:id`, `/edit/:id`
- Metadata stored per file (JSON)
- Auto‑cleanup: if new upload would exceed the 9GB budget, delete oldest files until it fits
- API input/response validation (zod)
- Global rate limit: 100 RPS/IP; on exceed, temporary 30‑min block

## Tech
- Next.js 14+ (App Router OK, but pages router shown here for clarity)
- TypeScript
- Cloudflare R2 (S3‑compatible)
- @upstash/redis + @upstash/ratelimit (edge‑friendly, free tier)
- zod for schemas

---

## Folder Structure
```
 droply/
 ├─ .github/workflows/ci.yml
 ├─ public/
 │   └─ favicon.ico
 ├─ src/
 │  ├─ pages/
 │  │  ├─ index.tsx
 │  │  ├─ download/[id].tsx
 │  │  ├─ delete/[id].tsx
 │  │  ├─ edit/[id].tsx
 │  │  └─ api/
 │  │     ├─ upload.ts
 │  │     ├─ download/[id].ts
 │  │     ├─ delete/[id].ts
 │  │     └─ edit/[id].ts
 │  ├─ middleware.ts
 │  ├─ lib/
 │  │  ├─ env.ts
 │  │  ├─ rateLimit.ts
 │  │  ├─ r2.ts
 │  │  ├─ id.ts
 │  │  └─ schemas.ts
 │  ├─ styles/globals.css
 │  └─ components/
 │     ├─ Uploader.tsx
 │     ├─ LinkCard.tsx
 │     └─ Layout.tsx
 ├─ .env.example
 ├─ package.json
 ├─ next.config.js
 └─ README.md (this file)
```

---

## Environment (.env)
```
# ===== Cloudflare R2 (S3-compatible) =====
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=droply
R2_PUBLIC_BASE=https://<your-r2-public-domain>         # optional; used to build file URLs
# Budget (bytes). We'll target 9GB to keep headroom under the free 10GB.
R2_MAX_TOTAL_BYTES=9663676416                          # ~9.0 GB

# ===== Rate Limiting (Upstash Redis) =====
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# Limits
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=100
ABUSE_COOLDOWN_SECONDS=1800  # 30 min

# ===== App =====
NEXT_PUBLIC_APP_URL=https://droply.vercel.app
MAX_FILE_BYTES=104857600     # 100 MB
ALLOWED_MIME_PREFIXES=image/,application/pdf,video/
```

> DO NOT commit `.env`. Copy `.env.example` and fill values locally and on Vercel.

---

## Git & GitHub quick start
```bash
# 1) create repo locally
mkdir droply && cd droply
# (paste this project content here)
git init -b main
cp .env.example .env
# fill .env

# 2) first commit
git add .
git commit -m "feat: Droply MVP skeleton (UI, APIs, R2, rate limit, cleanup stubs)"

# 3) create GitHub repo then push
# replace <you>/<repo>
git remote add origin git@github.com:<you>/droply.git
git push -u origin main

# 4) Vercel deploy
# - Import the repo on vercel.com
# - Add env vars from .env

# 5) Cloudflare R2
# - Create bucket 'droply'
# - Create API token with object read/write
# - Set public domain (optional)
```

---

### What your AI Editor should implement next
1. **`/api/upload` multipart parsing** with formidable or busboy
2. Double‑check **MIME/type filtering** vs `ALLOWED_MIME_PREFIXES`
3. Wire **`purgeOldestUntilFits(file.length)`** before `putFile`
4. Optional: move to **App Router** + **Edge Runtime** for API routes
5. Add simple 404 pages for missing files
6. Add image/video preview on `/download/[id]`

— End of MVP skeleton —
