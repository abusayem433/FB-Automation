# 📊 FB Automation Dashboard

A beautiful web-based dashboard to visualize summary reports from your Facebook automation logs.

## 🚀 Quick Start

### Option 1: Using the Server (Recommended)

1. Start the dashboard server:
   ```bash
   npm run dashboard
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. The dashboard will automatically load and display your reports!

### Option 2: Direct File Access

If you prefer to open the HTML file directly:
1. Open `report-dashboard.html` in your browser
2. Note: Some browsers may block loading JSON files due to CORS restrictions. If this happens, use Option 1 instead.

## 📈 Features

The dashboard provides:

- **Overall Statistics**
  - Total processed requests
  - Total approvals and declines
  - Approval/decline rates

- **Visual Charts**
  - Approval vs Decline pie chart
  - Top decline reasons bar chart
  - Class breakdown stacked bar chart

- **Detailed Class Statistics**
  - Per-class approval/decline counts
  - Approval rates per class
  - Top decline reasons for each class

- **Year Selection**
  - View reports for 2025
  - View reports for 2026
  - View combined reports for all years

## 📁 Files

- `report-dashboard.html` - The main dashboard HTML file
- `server.js` - Simple HTTP server to serve the dashboard
- `log2025/report.json` - Summary report for 2025
- `log2026/report.json` - Summary report for 2026

## 🔄 Auto-Update

Reports are automatically generated and updated:
- When you log an approval or decline
- When the automation system starts
- Reports are stored in `log{year}/report.json`

## 🎨 Dashboard Features

- **Responsive Design** - Works on desktop and mobile
- **Interactive Charts** - Powered by Chart.js
- **Real-time Data** - Reads directly from report.json files
- **Beautiful UI** - Modern gradient design with smooth animations

## 🛠️ Troubleshooting

**Dashboard shows "No data available"**
- Make sure reports have been generated (they're created automatically when logs are written)
- Check that `log2025/report.json` or `log2026/report.json` exist

**Can't load JSON files**
- Use the server method (`npm run dashboard`) instead of opening the HTML directly
- This avoids CORS restrictions

**Server won't start**
- Make sure port 3000 is not in use
- Check that Node.js is installed: `node --version`

## 📝 Notes

- The dashboard reads reports from the `log{year}/report.json` files
- Reports are automatically updated when new approvals/declines are logged
- You can switch between years using the buttons at the top
- All statistics are calculated from the actual log files
