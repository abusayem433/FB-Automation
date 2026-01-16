const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Extract year from the route parameter
        let year = req.query?.year;
        
        // If not in query, try extracting from URL path
        if (!year) {
            const urlMatch = req.url?.match(/\/api\/report\/(\d{4})/);
            if (urlMatch) {
                year = urlMatch[1];
            }
        }
        
        // Additional fallback: check if year is in the path directly
        if (!year && req.url) {
            const parts = req.url.split('/');
            const yearIndex = parts.indexOf('report') + 1;
            if (parts[yearIndex] && /^\d{4}$/.test(parts[yearIndex])) {
                year = parts[yearIndex];
            }
        }

        // Validate year format
        if (!year || !/^\d{4}$/.test(year)) {
            res.status(400).json({ error: 'Invalid year format. Expected 4-digit year (e.g., 2026)' });
            return;
        }

        // Get project root
        let projectRoot = path.join(__dirname, '..', '..');
        if (!fs.existsSync(path.join(projectRoot, `log${year}`))) {
            projectRoot = process.cwd();
        }

        // Read the report.json file
        const reportPath = path.join(projectRoot, `log${year}`, 'report.json');

        if (!fs.existsSync(reportPath)) {
            res.status(404).json({ error: `Report not found for year ${year}` });
            return;
        }

        const reportData = fs.readFileSync(reportPath, 'utf8');
        const report = JSON.parse(reportData);

        res.status(200).json(report);
    } catch (error) {
        console.error('Error in /api/report/[year]:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
