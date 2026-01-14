# ✅ Vercel Deployment Checklist

Before deploying to Vercel, verify the following:

## Pre-Deployment Checklist

- [ ] **Report files exist and are committed:**
  ```bash
  ls -la log2025/report.json log2026/report.json
  git status log2025/report.json log2026/report.json
  ```
  Both files should show as tracked (not untracked)

- [ ] **Report files are NOT in .gitignore:**
  ```bash
  grep -i "report\|log" .gitignore
  ```
  Should return nothing (or only unrelated entries)

- [ ] **vercel.json exists and is valid:**
  ```bash
  cat vercel.json | python -m json.tool
  ```
  Should validate without errors

- [ ] **Dashboard HTML file exists:**
  ```bash
  ls -la report-dashboard.html
  ```

- [ ] **Test dashboard locally:**
  ```bash
  npm run dashboard
  ```
  Visit http://localhost:3000 and verify it works

## Files That Will Be Deployed

✅ **Included:**
- `report-dashboard.html` (main dashboard)
- `log2025/report.json` (2025 data)
- `log2026/report.json` (2026 data)
- `vercel.json` (configuration)
- `.vercelignore` (exclusion rules)

❌ **Excluded (via .vercelignore):**
- `node_modules/`
- `fb_auto.js`
- `db_automation.js`
- `server.js`
- `.env` files
- Development files

## Quick Deployment Commands

```bash
# 1. Ensure reports are up to date
npm start  # This regenerates reports

# 2. Commit report files (if not already committed)
git add log2025/report.json log2026/report.json
git commit -m "Update reports for deployment"

# 3. Deploy to Vercel
vercel --prod

# Or if first time:
vercel login
vercel
```

## Post-Deployment Verification

After deployment, verify:

- [ ] Dashboard loads at your Vercel URL
- [ ] 2025 report loads correctly
- [ ] 2026 report loads correctly
- [ ] "All Years" view works
- [ ] Charts render properly
- [ ] Date-wise reports display correctly
- [ ] No console errors in browser

## Common Issues

### Issue: "Report not found" error
**Fix:** Ensure report JSON files are committed to git

### Issue: Charts don't render
**Fix:** Check browser console for JavaScript errors, verify Chart.js CDN is accessible

### Issue: CORS errors
**Fix:** Already handled in vercel.json headers configuration

### Issue: Reports not updating
**Fix:** Reports are static - regenerate locally and redeploy

## Updating Reports After Deployment

1. Run automation locally (generates new reports)
2. Commit updated report files:
   ```bash
   git add log2025/report.json log2026/report.json
   git commit -m "Update reports"
   git push
   ```
3. Vercel will auto-deploy (if connected to GitHub)

## Manual Report Update (Alternative)

If you need to update reports without running automation:

1. Manually edit `log2025/report.json` or `log2026/report.json`
2. Commit and push
3. Vercel redeploys automatically
