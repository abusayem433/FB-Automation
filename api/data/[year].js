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
            const urlMatch = req.url?.match(/\/api\/data\/(\d{4})/);
            if (urlMatch) {
                year = urlMatch[1];
            }
        }
        
        // Additional fallback: check if year is in the path directly
        if (!year && req.url) {
            const parts = req.url.split('/');
            const yearIndex = parts.indexOf('data') + 1;
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
        const logDir = path.join(projectRoot, `log${year}`);
        
        if (!fs.existsSync(logDir)) {
            // Try process.cwd() as fallback
            projectRoot = process.cwd();
            const fallbackLogDir = path.join(projectRoot, `log${year}`);
            if (!fs.existsSync(fallbackLogDir)) {
                res.status(404).json({ error: `Log directory not found for year ${year}` });
                return;
            }
        }

        const logDirPath = path.join(projectRoot, `log${year}`);
        
        // Read all files in the log directory
        const files = fs.readdirSync(logDirPath);
        
        // Filter only approval files
        const approvalFiles = files.filter(file => file.endsWith('_approvals.json'));
        
        if (approvalFiles.length === 0) {
            res.status(404).json({ error: `No approval files found for year ${year}` });
            return;
        }

        // Map to store course-wise transaction IDs and counts
        const courseBreakdown = {};
        // Map to store class-wise breakdown (courses only, no duplicate transaction IDs)
        const classBreakdown = {};

        // Helper function to extract class number from course name
        function extractClassNumber(courseName) {
            // Match patterns like "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
            const match = courseName.match(/Class\s+(\d+)/i);
            return match ? `Class ${match[1]}` : 'Unknown';
        }

        // Read each approval file and extract transaction IDs
        approvalFiles.forEach(file => {
            const filePath = path.join(logDirPath, file);
            
            try {
                const fileData = fs.readFileSync(filePath, 'utf8');
                const approvals = JSON.parse(fileData);
                
                // Extract course name from file name (remove _approvals.json and replace _ with space)
                // Example: Class_10_PCMMB_2026_approvals.json -> Class 10 PCMMB (2026)
                let courseName = file.replace('_approvals.json', '').replace(/_/g, ' ');
                // If file name contains year at the end, format it properly
                courseName = courseName.replace(/\s+(\d{4})$/, ' ($1)');
                
                // Initialize course in breakdown if not exists
                if (!courseBreakdown[courseName]) {
                    courseBreakdown[courseName] = {
                        count: 0,
                        transactionIds: []
                    };
                }
                
                // Handle both array and single object formats
                const approvalArray = Array.isArray(approvals) ? approvals : [approvals];
                
                approvalArray.forEach(approval => {
                    let trxId = null;
                    
                    // Try to get transaction ID from memberTrxId first
                    if (approval.memberTrxId && approval.memberTrxId !== 'null' && approval.memberTrxId.trim() !== '') {
                        trxId = approval.memberTrxId.trim();
                    }
                    // Fallback to memberQA if memberTrxId is not available
                    else if (approval.memberQA && approval.memberQA['তোমার ইউনিক ট্রানজেকশন আইডি']) {
                        const qaTrxId = approval.memberQA['তোমার ইউনিক ট্রানজেকশন আইডি'];
                        if (qaTrxId && qaTrxId !== 'null' && qaTrxId.trim() !== '') {
                            trxId = qaTrxId.trim();
                        }
                    }
                    
                    // If we found a transaction ID, add it to both sets
                    if (trxId) {
                        // Use className from approval data if available, otherwise use derived course name
                        const finalCourseName = approval.className || courseName;
                        
                        // Extract class number from course name
                        const className = extractClassNumber(finalCourseName);
                        
                        // Initialize course in breakdown if not exists (using className if available)
                        if (!courseBreakdown[finalCourseName]) {
                            courseBreakdown[finalCourseName] = {
                                count: 0,
                                transactionIds: [],
                                class: className
                            };
                        }
                        
                        // Initialize class in breakdown if not exists
                        if (!classBreakdown[className]) {
                            classBreakdown[className] = {
                                courses: {}
                            };
                        }
                        
                        // Add to course-specific list only if not already added to this course
                        if (!courseBreakdown[finalCourseName].transactionIds.includes(trxId)) {
                            courseBreakdown[finalCourseName].transactionIds.push(trxId);
                            courseBreakdown[finalCourseName].count++;
                        }
                        
                        // Track which courses belong to this class (same transaction IDs as in courseBreakdown)
                        if (!classBreakdown[className].courses[finalCourseName]) {
                            classBreakdown[className].courses[finalCourseName] = {
                                count: 0,
                                transactionIds: []
                            };
                        }
                        if (!classBreakdown[className].courses[finalCourseName].transactionIds.includes(trxId)) {
                            classBreakdown[className].courses[finalCourseName].transactionIds.push(trxId);
                            classBreakdown[className].courses[finalCourseName].count++;
                        }
                    }
                });
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
                // Continue with other files even if one fails
            }
        });

        // Sort transaction IDs for each course
        Object.keys(courseBreakdown).forEach(course => {
            courseBreakdown[course].transactionIds.sort();
        });

        // Sort transaction IDs for each course within each class
        Object.keys(classBreakdown).forEach(className => {
            Object.keys(classBreakdown[className].courses).forEach(course => {
                classBreakdown[className].courses[course].transactionIds.sort();
            });
        });

        // Calculate total transaction IDs by combining all courses
        let totalTransactionIds = 0;
        const allTransactionIds = new Set();
        Object.keys(courseBreakdown).forEach(course => {
            courseBreakdown[course].transactionIds.forEach(trxId => {
                allTransactionIds.add(trxId);
            });
        });
        totalTransactionIds = allTransactionIds.size;

        // Convert course breakdown to sorted array format for better readability
        const courseBreakdownArray = Object.keys(courseBreakdown)
            .sort()
            .map(course => ({
                course: course,
                class: courseBreakdown[course].class,
                count: courseBreakdown[course].count,
                transactionIds: courseBreakdown[course].transactionIds
            }));

        // Convert class breakdown to sorted array format
        const classBreakdownArray = Object.keys(classBreakdown)
            .sort((a, b) => {
                // Sort by class number (Class 6, Class 7, etc.)
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            })
            .map(className => ({
                class: className,
                courses: Object.keys(classBreakdown[className].courses)
                    .sort()
                    .map(course => ({
                        course: course,
                        count: classBreakdown[className].courses[course].count,
                        transactionIds: classBreakdown[className].courses[course].transactionIds
                    }))
            }));

        // Return the transaction IDs with course and class breakdown
        res.status(200).json({
            year: parseInt(year),
            totalTransactionIds: totalTransactionIds,
            classBreakdown: classBreakdownArray,
            classBreakdownByClass: classBreakdown, // Object format for easy lookup
            courseBreakdown: courseBreakdownArray,
            courseBreakdownByCourse: courseBreakdown // Also include object format for easy lookup
        });
    } catch (error) {
        console.error('Error in /api/data/[year]:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
