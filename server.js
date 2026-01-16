const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

// Helper function to set CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
    setCorsHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
}

// Helper function to send error response
function sendError(res, statusCode, message) {
    sendJSON(res, statusCode, { error: message });
}

// Helper function to read and parse JSON file
function readJSONFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

// Helper function to combine reports
function combineReports(reports) {
    const combined = {
        generatedAt: new Date().toISOString(),
        generatedDate: new Date().toLocaleString(),
        summary: {
            totalApprovals: 0,
            totalDeclines: 0,
            totalProcessed: 0
        },
        byClass: {},
        byDate: {},
        declineReasons: {},
        overallStats: {
            approvalRate: 0,
            declineRate: 0
        }
    };

    reports.forEach(report => {
        if (!report) return;

        combined.summary.totalApprovals += report.summary?.totalApprovals || 0;
        combined.summary.totalDeclines += report.summary?.totalDeclines || 0;
        combined.summary.totalProcessed += report.summary?.totalProcessed || 0;

        // Combine by class
        Object.keys(report.byClass || {}).forEach(className => {
            if (!combined.byClass[className]) {
                combined.byClass[className] = {
                    approvals: 0,
                    declines: 0,
                    total: 0,
                    declineReasons: {}
                };
            }
            combined.byClass[className].approvals += report.byClass[className].approvals || 0;
            combined.byClass[className].declines += report.byClass[className].declines || 0;
            combined.byClass[className].total += (report.byClass[className].approvals || 0) + (report.byClass[className].declines || 0);

            Object.keys(report.byClass[className].declineReasons || {}).forEach(reason => {
                if (!combined.byClass[className].declineReasons[reason]) {
                    combined.byClass[className].declineReasons[reason] = 0;
                }
                combined.byClass[className].declineReasons[reason] += report.byClass[className].declineReasons[reason] || 0;
            });
        });

        // Combine decline reasons
        Object.keys(report.declineReasons || {}).forEach(reason => {
            if (!combined.declineReasons[reason]) {
                combined.declineReasons[reason] = 0;
            }
            combined.declineReasons[reason] += report.declineReasons[reason] || 0;
        });

        // Combine by date
        Object.keys(report.byDate || {}).forEach(date => {
            if (!combined.byDate[date]) {
                combined.byDate[date] = {
                    approvals: 0,
                    declines: 0,
                    total: 0,
                    byClass: {}
                };
            }
            combined.byDate[date].approvals += report.byDate[date].approvals || 0;
            combined.byDate[date].declines += report.byDate[date].declines || 0;
            combined.byDate[date].total += report.byDate[date].total || 0;

            Object.keys(report.byDate[date].byClass || {}).forEach(className => {
                if (!combined.byDate[date].byClass[className]) {
                    combined.byDate[date].byClass[className] = {
                        approvals: 0,
                        declines: 0,
                        total: 0
                    };
                }
                combined.byDate[date].byClass[className].approvals += report.byDate[date].byClass[className].approvals || 0;
                combined.byDate[date].byClass[className].declines += report.byDate[date].byClass[className].declines || 0;
                combined.byDate[date].byClass[className].total += report.byDate[date].byClass[className].total || 0;
            });
        });
    });

    if (combined.summary.totalProcessed > 0) {
        combined.overallStats.approvalRate = ((combined.summary.totalApprovals / combined.summary.totalProcessed) * 100).toFixed(2);
        combined.overallStats.declineRate = ((combined.summary.totalDeclines / combined.summary.totalProcessed) * 100).toFixed(2);
    }

    return combined;
}

// Helper function to get available years
function getAvailableYears() {
    const years = [];
    const logDirs = fs.readdirSync(__dirname).filter(dir => {
        const fullPath = path.join(__dirname, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith('log');
    });

    logDirs.forEach(dir => {
        const match = dir.match(/log(\d{4})/);
        if (match) {
            const year = parseInt(match[1]);
            if (!years.includes(year)) {
                years.push(year);
            }
        }
    });

    return years.sort((a, b) => a - b);
}

// API route handler
function handleAPIRequest(req, res) {
    // Parse URL pathname (handle cases where host might be missing)
    let pathname = req.url.split('?')[0]; // Remove query string
    pathname = decodeURIComponent(pathname);

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    // GET /api/stats - List available years
    if (pathname === '/api/stats' && req.method === 'GET') {
        const years = getAvailableYears();
        sendJSON(res, 200, {
            availableYears: years,
            endpoints: {
                all: '/api/stats/all',
                byYear: '/api/stats/:year'
            }
        });
        return;
    }

    // GET /api/stats/all - Get combined stats for all years
    if (pathname === '/api/stats/all' && req.method === 'GET') {
        const years = getAvailableYears();
        const reports = years.map(year => {
            const reportPath = path.join(__dirname, `log${year}`, 'report.json');
            return readJSONFile(reportPath);
        }).filter(report => report !== null);

        if (reports.length === 0) {
            sendError(res, 404, 'No reports found');
            return;
        }

        const combined = combineReports(reports);
        sendJSON(res, 200, combined);
        return;
    }

    // GET /api/stats/:year - Get stats for a specific year
    const yearMatch = pathname.match(/^\/api\/stats\/(\d{4})$/);
    if (yearMatch && req.method === 'GET') {
        const year = yearMatch[1];
        const reportPath = path.join(__dirname, `log${year}`, 'report.json');
        const report = readJSONFile(reportPath);

        if (!report) {
            sendError(res, 404, `Report not found for year ${year}`);
            return;
        }

        sendJSON(res, 200, report);
        return;
    }

    // 404 for unknown API routes
    sendError(res, 404, 'API endpoint not found');
}

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle API requests
    if (req.url.startsWith('/api/')) {
        handleAPIRequest(req, res);
        return;
    }

    // Remove query string and decode URL
    let filePath = decodeURIComponent(req.url.split('?')[0]);

    // Default to dashboard
    if (filePath === '/') {
        filePath = '/report-dashboard.html';
    }

    // Security: prevent directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // Remove leading slash
    filePath = filePath.substring(1);

    // If no file extension, try adding .html
    if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.html');
    }

    const fullPath = path.join(__dirname, filePath);

    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        // Read and serve file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error');
                return;
            }

            const ext = path.extname(fullPath);
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Dashboard server running at http://localhost:${PORT}`);
    console.log(`📊 Open http://localhost:${PORT} in your browser to view the reports`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   GET /api/stats - List available years`);
    console.log(`   GET /api/stats/all - Get combined stats for all years`);
    console.log(`   GET /api/stats/:year - Get stats for a specific year (e.g., /api/stats/2026)`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});
