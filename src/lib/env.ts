export const env = {
  database: {
    url: process.env.DATABASE_URL || null,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "demo",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "demo",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "demo",
    bucket: process.env.R2_BUCKET_NAME || "droply",
    publicBase: process.env.R2_PUBLIC_BASE || "",
    maxTotalBytes: Number(process.env.R2_MAX_TOTAL_BYTES || 9 * 1024 * 1024 * 1024),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    maxFileBytes: Number(process.env.MAX_FILE_BYTES || 100 * 1024 * 1024),
    allowedMimePrefixes: (process.env.ALLOWED_MIME_PREFIXES || "image/,application/pdf,video/").split(","),
  }
};

// Check if we're in demo mode
export const isDemoMode = !env.database.url || env.r2.accountId === "demo";
