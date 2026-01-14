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

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

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
    console.log(`\nPress Ctrl+C to stop the server\n`);
});
