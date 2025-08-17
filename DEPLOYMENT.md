# Deployment Guide for Droply

This guide will walk you through deploying Droply to Vercel with Cloudflare R2 storage and Upstash Redis.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Cloudflare account (free tier available)
- Upstash account (free tier available)

## Step 1: Set up Cloudflare R2

1. **Create Cloudflare Account**
   - Go to [cloudflare.com](https://cloudflare.com) and sign up
   - Verify your email

2. **Create R2 Bucket**
   - In Cloudflare dashboard, go to "R2 Object Storage"
   - Click "Create bucket"
   - Name it `droply`
   - Choose a region close to your users

3. **Create API Token**
   - Go to "My Profile" → "API Tokens"
   - Click "Create Token"
   - Use "Custom token" template
   - Add these permissions:
     - `Cloudflare R2:Edit` (for your account)
   - Set account resources to "Include: All accounts"
   - Set zone resources to "Include: All zones"
   - Click "Continue to summary" and create

4. **Get Account ID**
   - In dashboard, look at the right sidebar for your Account ID

## Step 2: Set up Upstash Redis

1. **Create Upstash Account**
   - Go to [upstash.com](https://upstash.com) and sign up
   - Verify your email

2. **Create Database**
   - Click "Create Database"
   - Choose a region close to your users
   - Name it `droply-redis`
   - Click "Create"

3. **Get Credentials**
   - Copy the `UPSTASH_REDIS_REST_URL`
   - Copy the `UPSTASH_REDIS_REST_TOKEN`

## Step 3: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: Droply MVP - anonymous file sharing app"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Keep default settings and click "Deploy"

3. **Configure Environment Variables**
   - In your Vercel project dashboard, go to "Settings" → "Environment Variables"
   - Add each variable from your `.env` file:
   
   ```
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=droply
   R2_MAX_TOTAL_BYTES=9663676416
   
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   RATE_LIMIT_WINDOW_SECONDS=60
   RATE_LIMIT_MAX_REQUESTS=100
   ABUSE_COOLDOWN_SECONDS=1800
   
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   MAX_FILE_BYTES=104857600
   ALLOWED_MIME_PREFIXES=image/,application/pdf,video/
   ```

4. **Redeploy**
   - Go to "Deployments" tab
   - Click the three dots on your latest deployment
   - Select "Redeploy"

## Step 4: Test Your Deployment

1. **Upload a File**
   - Visit your deployed app
   - Try uploading a small image or PDF
   - Verify you get download/delete/edit links

2. **Test Rate Limiting**
   - Try making many rapid requests
   - Verify you get rate limited after 100 requests

3. **Test File Operations**
   - Download a file
   - Edit metadata
   - Delete a file

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Double-check your R2 API token permissions
   - Ensure account ID is correct

2. **"Rate limit exceeded" immediately**
   - Check Upstash Redis credentials
   - Verify Redis database is active

3. **Files not uploading**
   - Check R2 bucket permissions
   - Verify bucket name matches exactly

4. **Build errors**
   - Ensure all environment variables are set in Vercel
   - Check that `NEXT_PUBLIC_APP_URL` matches your actual domain

### Environment Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `R2_ACCOUNT_ID` | Your Cloudflare account ID | `1234567890abcdef` |
| `R2_ACCESS_KEY_ID` | R2 API token access key | `AKIAIOSFODNN7EXAMPLE` |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `R2_BUCKET_NAME` | R2 bucket name | `droply` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | `AY...` |

## Security Considerations

- **Never commit `.env` files** to version control
- **Use environment variables** for all sensitive data
- **Monitor usage** in Cloudflare and Upstash dashboards
- **Set up alerts** for unusual activity
- **Regularly rotate** API keys and tokens

## Cost Optimization

- **R2**: Free tier includes 10GB storage, 1M Class A operations/month
- **Upstash**: Free tier includes 10K requests/day
- **Vercel**: Free tier includes 100GB bandwidth/month

Monitor your usage to stay within free tiers or upgrade as needed.

## Support

If you encounter issues:
1. Check the [Cloudflare R2 documentation](https://developers.cloudflare.com/r2/)
2. Check the [Upstash documentation](https://docs.upstash.com/)
3. Check the [Vercel documentation](https://vercel.com/docs)
4. Open an issue in this repository

---

🎉 **Congratulations!** Your Droply app is now deployed and ready to share files anonymously!
