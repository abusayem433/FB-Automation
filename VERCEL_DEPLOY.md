# 🚀 Deploying Dashboard to Vercel

This guide will help you deploy the FB Automation Dashboard to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, but recommended):
   ```bash
   npm i -g vercel
   ```

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy from project directory:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new one
   - Confirm project settings
   - Deploy!

4. **For production deployment:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add dashboard for Vercel deployment"
   git push
   ```

2. **Import project in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect settings
   - Click "Deploy"

3. **Configure build settings** (if needed):
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: (leave empty)

## What Gets Deployed

The following files will be deployed:
- ✅ `report-dashboard.html` - Main dashboard
- ✅ `log2025/report.json` - 2025 report data
- ✅ `log2026/report.json` - 2026 report data
- ✅ `vercel.json` - Vercel configuration

The following files are excluded (via `.vercelignore`):
- ❌ `node_modules/` - Dependencies
- ❌ `fb_auto.js` - Automation script (not needed for dashboard)
- ❌ `db_automation.js` - Database script (not needed for dashboard)
- ❌ `.env` files - Environment variables
- ❌ Other development files

## Important Notes

### 1. Report Files Must Be Committed

Make sure your `log2025/report.json` and `log2026/report.json` files are:
- ✅ Committed to git
- ✅ Pushed to your repository
- ✅ Not in `.gitignore`

If reports are in `.gitignore`, they won't be deployed. You may need to:
```bash
git add -f log2025/report.json log2026/report.json
git commit -m "Add report files for deployment"
```

### 2. Updating Reports

After the dashboard is deployed, reports are static. To update them:

1. **Regenerate reports locally:**
   ```bash
   npm start  # This will regenerate reports
   ```

2. **Commit and push updated reports:**
   ```bash
   git add log2025/report.json log2026/report.json
   git commit -m "Update reports"
   git push
   ```

3. **Vercel will auto-deploy** the updated reports (if you have auto-deploy enabled)

### 3. Custom Domain (Optional)

After deployment, you can add a custom domain:
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Dashboard shows "Error loading report"

**Problem:** JSON files not accessible

**Solution:**
- Check that `log2025/report.json` and `log2026/report.json` are committed to git
- Verify files exist in the deployed project
- Check browser console for CORS errors

### Reports not updating

**Problem:** Reports are static files, need to be regenerated and redeployed

**Solution:**
- Regenerate reports locally
- Commit and push updated JSON files
- Vercel will redeploy automatically

### Build fails

**Problem:** Vercel build process fails

**Solution:**
- Check `.vercelignore` doesn't exclude necessary files
- Ensure `vercel.json` is valid JSON
- Check Vercel build logs for specific errors

## Environment Variables (Not Needed)

The dashboard doesn't require any environment variables as it reads static JSON files. However, if you want to add analytics or other features later, you can add them in Vercel project settings.

## Continuous Deployment

If you connect your GitHub repository:
- Every push to `main`/`master` branch triggers a new deployment
- Updated reports will automatically be deployed
- You can set up preview deployments for other branches

## Performance

- Reports are cached for 5 minutes (300 seconds)
- Static files are served via Vercel's CDN
- Dashboard loads quickly from any location

## Security

- No sensitive data is exposed (reports are summary statistics only)
- CORS headers are configured for JSON files
- No authentication required (dashboard is public)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify files are committed to git
3. Check browser console for errors
4. Ensure `vercel.json` is properly configured
