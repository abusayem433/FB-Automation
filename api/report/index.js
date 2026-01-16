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
        // Get project root
        let projectRoot = path.join(__dirname, '..', '..');
        if (!fs.existsSync(path.join(projectRoot, 'log2025')) && !fs.existsSync(path.join(projectRoot, 'log2026'))) {
            projectRoot = process.cwd();
        }

        const yearWiseSummary = {};

        // Read reports for available years
        const years = [2025, 2026];
        
        years.forEach(year => {
            const reportPath = path.join(projectRoot, `log${year}`, 'report.json');
            
            if (fs.existsSync(reportPath)) {
                try {
                    const reportData = fs.readFileSync(reportPath, 'utf8');
                    const report = JSON.parse(reportData);
                    
                    // Extract only summary and overallStats
                    yearWiseSummary[year] = {
                        summary: report.summary || {},
                        overallStats: report.overallStats || {},
                        generatedAt: report.generatedAt || null,
                        generatedDate: report.generatedDate || null
                    };
                } catch (error) {
                    console.error(`Error reading report for year ${year}:`, error.message);
                }
            }
        });

        // Return the year-wise summary
        res.status(200).json(yearWiseSummary);
    } catch (error) {
        console.error('Error in /api/report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
