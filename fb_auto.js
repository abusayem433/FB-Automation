// filename: facebook-profile.js
require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { processPaymentApproval, saveMemberLog } = require("./db_automation.js");
const config = require("./config.js");

// Toast notification system
let currentProcessingCount = 0;
let totalMembers = 0;
let logMessages = [];

// Multi-tab tracking system
let tabData = new Map(); // Map to store data for each tab (className -> {page, currentCount, totalMembers, logMessages})
let isMultiTabMode = false;
// Multi-class group completion tracking
let completedClasses = 0;
let totalClasses = 0;

// JSON Logging Functions
// Function to get logs directory based on year
function getLogsDir(year) {
  const logsDir = path.join(__dirname, `log${year}`);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

// Function to sanitize class name for file naming
function sanitizeClassName(className) {
  return className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

// Function to generate summary report from all log files in a directory
function generateSummaryReport(logsDir) {
  try {
    const reportFile = path.join(logsDir, 'report.json');
    const report = {
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

    // Helper function to extract date from timestamp
    function extractDate(timestamp) {
      if (!timestamp) return null;
      try {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
      } catch (e) {
        return null;
      }
    }

    // Read all files in the logs directory
    if (!fs.existsSync(logsDir)) {
      console.log(`⚠️ Logs directory does not exist: ${logsDir}`);
      return;
    }

    const files = fs.readdirSync(logsDir);
    const approvalFiles = files.filter(f => f.endsWith('_approvals.json') && f !== 'report.json');
    const declineFiles = files.filter(f => f.endsWith('_declines.json') && f !== 'report.json');

    // Process approval files
    approvalFiles.forEach(file => {
      try {
        const filePath = path.join(logsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim()) {
          const approvals = JSON.parse(content);
          const className = approvals[0]?.className || file.replace('_approvals.json', '').replace(/_/g, ' ');
          
          if (!report.byClass[className]) {
            report.byClass[className] = {
              approvals: 0,
              declines: 0,
              total: 0,
              declineReasons: {}
            };
          }
          
          report.byClass[className].approvals = approvals.length;
          report.summary.totalApprovals += approvals.length;
          
          // Process date-wise statistics for approvals
          approvals.forEach(approval => {
            const date = extractDate(approval.timestamp);
            if (date) {
              if (!report.byDate[date]) {
                report.byDate[date] = {
                  approvals: 0,
                  declines: 0,
                  total: 0,
                  byClass: {}
                };
              }
              report.byDate[date].approvals++;
              report.byDate[date].total++;
              
              // Track by class for this date
              if (!report.byDate[date].byClass[className]) {
                report.byDate[date].byClass[className] = {
                  approvals: 0,
                  declines: 0,
                  total: 0
                };
              }
              report.byDate[date].byClass[className].approvals++;
              report.byDate[date].byClass[className].total++;
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error reading approval file ${file}:`, error.message);
      }
    });

    // Process decline files
    declineFiles.forEach(file => {
      try {
        const filePath = path.join(logsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim()) {
          const declines = JSON.parse(content);
          const className = declines[0]?.className || file.replace('_declines.json', '').replace(/_/g, ' ');
          
          if (!report.byClass[className]) {
            report.byClass[className] = {
              approvals: 0,
              declines: 0,
              total: 0,
              declineReasons: {}
            };
          }
          
          report.byClass[className].declines = declines.length;
          report.summary.totalDeclines += declines.length;
          
          // Count decline reasons and process date-wise statistics
          declines.forEach(decline => {
            const reason = decline.declineReason || 'Unknown reason';
            if (!report.byClass[className].declineReasons[reason]) {
              report.byClass[className].declineReasons[reason] = 0;
            }
            report.byClass[className].declineReasons[reason]++;
            
            // Overall decline reasons
            if (!report.declineReasons[reason]) {
              report.declineReasons[reason] = 0;
            }
            report.declineReasons[reason]++;
            
            // Process date-wise statistics for declines
            const date = extractDate(decline.timestamp);
            if (date) {
              if (!report.byDate[date]) {
                report.byDate[date] = {
                  approvals: 0,
                  declines: 0,
                  total: 0,
                  byClass: {}
                };
              }
              report.byDate[date].declines++;
              report.byDate[date].total++;
              
              // Track by class for this date
              if (!report.byDate[date].byClass[className]) {
                report.byDate[date].byClass[className] = {
                  approvals: 0,
                  declines: 0,
                  total: 0
                };
              }
              report.byDate[date].byClass[className].declines++;
              report.byDate[date].byClass[className].total++;
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error reading decline file ${file}:`, error.message);
      }
    });

    // Calculate totals per class and overall
    Object.keys(report.byClass).forEach(className => {
      const classData = report.byClass[className];
      classData.total = classData.approvals + classData.declines;
    });

    report.summary.totalProcessed = report.summary.totalApprovals + report.summary.totalDeclines;
    
    if (report.summary.totalProcessed > 0) {
      report.overallStats.approvalRate = ((report.summary.totalApprovals / report.summary.totalProcessed) * 100).toFixed(2);
      report.overallStats.declineRate = ((report.summary.totalDeclines / report.summary.totalProcessed) * 100).toFixed(2);
    }

    // Write report to file
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(`📊 Summary report generated: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Error generating summary report:', error.message);
  }
}

// Function to initialize reports for all existing log folders
function initializeReportsForAllLogFolders() {
  try {
    const years = [2025, 2026]; // Add more years as needed
    years.forEach(year => {
      const logsDir = getLogsDir(year);
      if (fs.existsSync(logsDir)) {
        console.log(`📊 Generating report for log${year}...`);
        generateSummaryReport(logsDir);
      }
    });
  } catch (error) {
    console.error('❌ Error initializing reports:', error.message);
  }
}

// Function to log approval to JSON file
function logApprovalToJSON(className, memberData) {
  try {
    const normalizedClassName =
      config && typeof config.normalizeClassName === "function"
        ? config.normalizeClassName(className)
        : className;
    
    // Get year from class config
    const classConfig = config.CLASSES[normalizedClassName];
    const year = classConfig?.YEAR || 2026; // Default to 2026 if not found
    const logsDir = getLogsDir(year);
    
    const sanitizedClassName = sanitizeClassName(normalizedClassName);
    const logFile = path.join(logsDir, `${sanitizedClassName}_approvals.json`);
    
    // Create log entry with all available data
    const logEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString(),
      className: normalizedClassName,
      memberName: memberData.memberName || 'Unknown',
      facebookUserId: memberData.facebookUserId || '',
      memberUserId: memberData.memberUserId || '',
      memberPhone: memberData.memberPhone || '',
      memberTrxId: memberData.memberTrxId || '',
      memberQA: memberData.memberQA || {},
      approvalStatus: 'approved',
      declineReason: null,
      processedBy: 'FB-Automation'
    };
    
    // Read existing data or create new array
    let approvals = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      if (fileContent.trim()) {
        approvals = JSON.parse(fileContent);
      }
    }
    
    // Add new entry
    approvals.push(logEntry);
    
    // Write back to file with pretty formatting
    fs.writeFileSync(logFile, JSON.stringify(approvals, null, 2), 'utf8');
    console.log(`📝 Approval logged to: ${logFile}`);
    
    // Generate/update summary report
    generateSummaryReport(logsDir);
    
  } catch (error) {
    console.error('❌ Error logging approval to JSON:', error.message);
  }
}

// Function to log decline to JSON file
function logDeclineToJSON(className, memberData) {
  try {
    const normalizedClassName =
      config && typeof config.normalizeClassName === "function"
        ? config.normalizeClassName(className)
        : className;
    
    // Get year from class config
    const classConfig = config.CLASSES[normalizedClassName];
    const year = classConfig?.YEAR || 2026; // Default to 2026 if not found
    const logsDir = getLogsDir(year);
    
    const sanitizedClassName = sanitizeClassName(normalizedClassName);
    const logFile = path.join(logsDir, `${sanitizedClassName}_declines.json`);
    
    // Create log entry with all available data
    const logEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString(),
      className: normalizedClassName,
      memberName: memberData.memberName || 'Unknown',
      facebookUserId: memberData.facebookUserId || '',
      memberUserId: memberData.memberUserId || '',
      memberPhone: memberData.memberPhone || '',
      memberTrxId: memberData.memberTrxId || '',
      memberQA: memberData.memberQA || {},
      approvalStatus: memberData.approvalStatus || 'declined',
      declineReason: memberData.declineReason || 'Unknown reason',
      processedBy: 'FB-Automation'
    };
    
    // Read existing data or create new array
    let declines = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      if (fileContent.trim()) {
        declines = JSON.parse(fileContent);
      }
    }
    
    // Add new entry
    declines.push(logEntry);
    
    // Write back to file with pretty formatting
    fs.writeFileSync(logFile, JSON.stringify(declines, null, 2), 'utf8');
    console.log(`📝 Decline logged to: ${logFile}`);
    
    // Generate/update summary report
    generateSummaryReport(logsDir);
    
  } catch (error) {
    console.error('❌ Error logging decline to JSON:', error.message);
  }
}

// Function to prompt user for class selection
function promptClassSelection() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🎓 FB Automation - Class Selection');
    console.log('=====================================');
    console.log('0. 🚀 ALL CLASSES (Sequential processing)');
    console.log('Y25. 📅 ALL Year 2025 CLASSES (Sequential processing)');
    console.log('Y26. 📅 ALL Year 2026 CLASSES (Sequential processing)');
    console.log('FB. 🌐 Open Facebook.com (Personal use - no automation)');
    console.log('Available classes:');
    
    const availableClasses = config.getAvailableClasses();
    availableClasses.forEach((className, index) => {
      console.log(`${index + 1}. ${className}`);
    });
    
    console.log('=====================================');
    
    const askForClass = () => {
      rl.question('\nWhich class do you want to start the operation for? (Enter number or class name): ', (answer) => {
        let selectedClass = null;
        const normalizedAnswer = String(answer || '').trim().toLowerCase();
        
        // Check for option 0 (all classes)
        if (answer === '0' || normalizedAnswer === 'all' || normalizedAnswer === 'all classes') {
          // Check if at least one class is configured
          const configuredClasses = availableClasses.filter(className => {
            const classConfig = config.CLASSES[className];
            return classConfig.GROUP_URL && classConfig.ELIGIBLE_PRODUCT_IDS.length > 0;
          });
          
          if (configuredClasses.length === 0) {
            console.log('\n❌ Error: No classes are configured yet.');
            console.log('Please configure at least one class before using the ALL CLASSES option.');
            rl.close();
            resolve(null);
            return;
          }
          
          console.log(`\n✅ Selected: ALL CLASSES (${configuredClasses.length} configured classes)`);
          configuredClasses.forEach(className => {
            console.log(`  - ${className}`);
          });
          rl.close();
          resolve('ALL_CLASSES');
          return;
        }

        // Check for Year group selection
        if (
          normalizedAnswer === 'y25' ||
          normalizedAnswer === 'year 2025' ||
          normalizedAnswer === '2025' ||
          normalizedAnswer === 'y2025'
        ) {
          const configured = config.getConfiguredClassesByYear(2025);
          if (configured.length === 0) {
            console.log('\n❌ Error: No Year 2025 classes are configured yet.');
            console.log('Please configure at least one Year 2025 class before using this option.');
            rl.close();
            resolve(null);
            return;
          }
          console.log(`\n✅ Selected: ALL Year 2025 CLASSES (${configured.length} configured classes)`);
          configured.forEach((className) => console.log(`  - ${className}`));
          rl.close();
          resolve('YEAR_2025');
          return;
        }

        if (
          normalizedAnswer === 'y26' ||
          normalizedAnswer === 'year 2026' ||
          normalizedAnswer === '2026' ||
          normalizedAnswer === 'y2026'
        ) {
          const configured = config.getConfiguredClassesByYear(2026);
          if (configured.length === 0) {
            console.log('\n❌ Error: No Year 2026 classes are configured yet.');
            console.log('Please set Year 2026 GROUP_URL and ELIGIBLE_PRODUCT_IDS in config.js first.');
            rl.close();
            resolve(null);
            return;
          }
          console.log(`\n✅ Selected: ALL Year 2026 CLASSES (${configured.length} configured classes)`);
          configured.forEach((className) => console.log(`  - ${className}`));
          rl.close();
          resolve('YEAR_2026');
          return;
        }

        // Check for Facebook.com option (personal use)
        if (
          normalizedAnswer === 'fb' ||
          normalizedAnswer === 'facebook' ||
          normalizedAnswer === 'facebook.com' ||
          normalizedAnswer === 'personal'
        ) {
          console.log('\n✅ Selected: Open Facebook.com (Personal use)');
          rl.close();
          resolve('FACEBOOK_PERSONAL');
          return;
        }
        
        // Check if input is a number
        const classIndex = parseInt(answer) - 1;
        if (!isNaN(classIndex) && classIndex >= 0 && classIndex < availableClasses.length) {
          selectedClass = availableClasses[classIndex];
        } else {
          // Check if input matches a class name
          const matchedClass = availableClasses.find(className => 
            className.toLowerCase() === answer.toLowerCase()
          );
          if (matchedClass) {
            selectedClass = matchedClass;
          }
        }
        
        if (selectedClass) {
          // Check if the selected class has been configured
          const classConfig = config.CLASSES[selectedClass];
          if (!classConfig.GROUP_URL || classConfig.ELIGIBLE_PRODUCT_IDS.length === 0) {
            console.log(`\n❌ Error: ${selectedClass} is not configured yet.`);
            console.log('Please provide the group URL and eligible product IDs for this class first.');
            rl.close();
            resolve(null);
            return;
          }
          
          console.log(`\n✅ Selected: ${selectedClass}`);
          config.setSelectedClass(selectedClass);
          rl.close();
          resolve(selectedClass);
        } else {
          console.log('\n❌ Invalid selection. Please try again.');
          askForClass();
        }
      });
    };
    
    askForClass();
  });
}

// Function to create and show toast notification
async function showToast(page, message, type = 'info', className = null) {
  try {
    // Get the appropriate data based on whether we're in multi-tab mode
    let progress, total, logs;
    
    if (isMultiTabMode && className && tabData.has(className)) {
      const data = tabData.get(className);
      progress = data.currentCount;
      total = data.totalMembers;
      logs = data.logMessages;
    } else {
      progress = currentProcessingCount;
      total = totalMembers;
      logs = logMessages;
    }

    // Ensure toast element exists in the current page (after reloads too)
    await page.evaluate(() => {
      let toast = document.getElementById('fb-automation-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'fb-automation-toast';
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #1877f2;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 400px;
          min-width: 300px;
          max-height: 500px;
          overflow-y: auto;
          overflow-wrap: break-word;
        `;
        document.body.appendChild(toast);
      }
    });

    // Update toast content
    await page.evaluate(({ msg, msgType, progress, total, logs, className, isMultiTab, completedGroups, totalGroups }) => {
      const toast = document.getElementById('fb-automation-toast');
      if (toast) {
        const timestamp = new Date().toLocaleTimeString();
        const progressText = total > 0 ? `Processing ${progress}/${total}` : 'Processing...';
        const classText = isMultiTab && className ? ` - ${className}` : '';
        const groupStatusText = isMultiTab && totalGroups > 0 ? ` | Groups: ${completedGroups}/${totalGroups} completed` : '';
        
        toast.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">
            🤖 FB Automation${classText} - ${progressText}${groupStatusText}
          </div>
          <div style="margin-bottom: 8px; font-size: 15px; color: ${msgType === 'error' ? '#ff6b6b' : msgType === 'success' ? '#51cf66' : '#74c0fc'};">
            ${msg}
          </div>
          <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">
            Last update: ${timestamp}
          </div>
          <div style="font-size: 11px; color: #ddd; max-height: 200px; overflow-y: auto;">
            Recent logs:<br>
            ${logs.slice(-5).map(log => `• ${log}`).join('<br>')}
          </div>
        `;
        
        // Auto-reduce opacity after 5 seconds for non-error messages
        if (msgType !== 'error') {
          setTimeout(() => {
            if (toast) toast.style.opacity = '0.7';
          }, 5000);
        } else {
          toast.style.opacity = '1';
        }
      }
    }, { 
      msg: message, 
      msgType: type, 
      progress: progress, 
      total: total, 
      logs: logs,
      className: className,
      isMultiTab: isMultiTabMode,
      completedGroups: completedClasses,
      totalGroups: totalClasses
    });

  } catch (error) {
    console.error('Error showing toast:', error.message);
  }
}

// Function to wait with visual countdown timer
async function waitWithCountdown(page, waitTimeMs, message, className = null) {
  const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
  const startTime = Date.now();
  
  console.log(`⏳ ${message} - Starting ${waitTimeSeconds} second countdown...`);
  
  for (let remaining = waitTimeSeconds; remaining > 0; remaining--) {
    const countdownMessage = `${message} (${remaining}...)`;
    console.log(`⏳ ${countdownMessage}`);
    
    // Update toast with countdown
    if (page && !page.isClosed()) {
      try {
        await showToast(page, countdownMessage, 'info', className);
      } catch (e) {
        // Toast update failed, continue anyway
      }
    }
    
    // Wait for exactly 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate remaining time to ensure exact wait duration
  const elapsed = Date.now() - startTime;
  const remaining = waitTimeMs - elapsed;
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
  
  console.log(`✅ ${message} - Wait completed (${waitTimeMs/1000}s)`);
}

// Function to add log message
function addLogMessage(message, className = null) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  if (isMultiTabMode && className && tabData.has(className)) {
    const data = tabData.get(className);
    data.logMessages.push(logEntry);
    // Keep only last 20 messages per tab
    if (data.logMessages.length > 20) {
      data.logMessages = data.logMessages.slice(-20);
    }
  } else {
    logMessages.push(logEntry);
    // Keep only last 20 messages
    if (logMessages.length > 20) {
      logMessages = logMessages.slice(-20);
    }
  }
}

// Function to initialize tab data for a class
function initializeTabData(className, page) {
  tabData.set(className, {
    page: page,
    currentCount: 0,
    totalMembers: 0,
    logMessages: []
  });
}

// Function to update tab processing count
function updateTabProcessingCount(className, current, total = null) {
  if (tabData.has(className)) {
    const data = tabData.get(className);
    data.currentCount = current;
    if (total !== null) {
      data.totalMembers = total;
    }
  }
}

// NOTE: MIN_REQUEST_AGE filtering has been removed by request.


// Function to save member processing data to database
async function saveMemberProcessingData(page, memberData, className = null) {
  try {
    await saveMemberLog(memberData);
    addLogMessage(`📝 Saved member log: ${memberData.memberName}`, className);
    await showToast(page, `📝 Saved log for ${memberData.memberName}`, 'info', className);
  } catch (error) {
    console.error('❌ Error saving member log:', error.message);
    addLogMessage(`❌ Failed to save log: ${error.message}`, className);
    await showToast(page, `❌ Failed to save log`, 'error', className);
  }
}
// Function to decline member directly without feedback
async function declineDirectly(page, memberCard, className = null) {
  try {
    console.log("🔄 Starting direct decline process...");
    
    // Find the decline button directly
    const declineButton = await memberCard.$('[aria-label*="Decline"]');
    if (declineButton) {
      await declineButton.click();
      console.log("✅ Direct decline button clicked");
      
      // Wait after decline click with countdown
      await waitWithCountdown(page, config.getWaitTime(config.DECLINE_WAIT), `Waiting after decline`, className);
    } else {
      console.log("❌ Decline button not found");
    }
  } catch (error) {
    console.error("❌ Error in direct decline:", error.message);
  }
}

// Function to decline member with feedback
async function declineWithFeedback(page, memberCard, declineReason, className = null) {
  try {
    console.log("🔄 Starting decline with feedback process...");
    
    // Find the more options button (three dots)
    const moreOptionsButton = await memberCard.$('[aria-label*="More options"]');
    if (!moreOptionsButton) {
      console.log("❌ More options button not found, using simple decline");
      const declineButton = await memberCard.$('[aria-label*="Decline"]');
      if (declineButton) {
        await declineButton.click();
      }
      return;
    }
    
    console.log("🔍 Clicking more options button...");
    await moreOptionsButton.click();
    
    // Wait for the menu to appear
    await page.waitForTimeout(config.getWaitTime(config.DECLINE_MODAL_WAIT));
    
    // Look for "Decline with feedback" option
    console.log("🔍 Looking for 'Decline with feedback' option...");
    let declineWithFeedbackButton = await page.$('[role="menuitem"]:has-text("Decline with feedback")');
    
    if (!declineWithFeedbackButton) {
      // Try alternative selectors
      declineWithFeedbackButton = await page.$('div:has-text("Decline with feedback")');
    }
    
    if (!declineWithFeedbackButton) {
      // Try more specific selector
      declineWithFeedbackButton = await page.$('[role="menuitem"] div:has-text("Decline with feedback")');
    }
    
    if (declineWithFeedbackButton) {
      await declineWithFeedbackButton.click();
      console.log("✅ Clicked 'Decline with feedback' option");
    } else {
      console.log("❌ Could not find decline with feedback option, using simple decline");
      return;
    }
    
    // Wait for the feedback modal to appear
    console.log("⏳ Waiting for feedback modal...");
    await page.waitForTimeout(config.getWaitTime(config.DECLINE_MODAL_WAIT));
  
    // Select "Issue with answer to questions" radio button
    console.log("🔍 Selecting 'Issue with answer to questions' radio button...");
    
    // First try to find the radio button directly
    let issueRadioButton = await page.$('[role="radio"][aria-checked="false"]');
    
    if (!issueRadioButton) {
      // Try finding by text content
      const issueText = await page.$(':text("Issue with answer to questions")');
      if (issueText) {
        // Find the parent container and then the radio button
        const parentContainer = await issueText.$('..');
        issueRadioButton = await parentContainer.$('[role="radio"]');
      }
      else{
        console.log("❌ Modal not found, using simple decline");
        const declineButton = await memberCard.$('[aria-label*="Decline"]');
        if (declineButton) {
          await declineButton.click();
        }
      }
    }
    
    if (issueRadioButton) {
      await issueRadioButton.click();
      console.log("✅ Selected 'Issue with answer to questions'");
    } else {
      console.log("⚠️ Could not find issue radio button, proceeding without selection");
    }
    
    // Fill the textarea with decline reason
    console.log("📝 Filling decline reason in textarea...");
    let textarea = await page.$('textarea[placeholder*="Write feedback"]');
    
    if (!textarea) {
      // Try alternative selector
      textarea = await page.$('textarea');
    }
    
    if (textarea) {
      await textarea.click();
      await textarea.fill(declineReason);
      console.log(`✅ Filled textarea with: ${declineReason}`);
    } else {
      console.log("❌ Could not find feedback textarea");
    }
    
    // Click the final decline button
    console.log("🔍 Looking for final decline button...");
    await page.waitForTimeout(config.getWaitTime(config.DECLINE_MODAL_WAIT)); // Wait for modal to fully load
    
    // Try the exact selector from the HTML structure
    let finalDeclineButton = await page.$('[aria-label="Decline"][role="button"]');
    
    if (!finalDeclineButton) {
      // Try alternative selectors based on the exact HTML structure
      finalDeclineButton = await page.$('div[aria-label="Decline"]');
    }
    
    if (!finalDeclineButton) {
      // Try finding by the specific class structure from your HTML
      finalDeclineButton = await page.$('div.xp48ta0.xtssl2i.xtvsq51.x1r1pt67');
    }
    
    if (!finalDeclineButton) {
      // Try finding by the span text inside
      finalDeclineButton = await page.$('div:has(span:has-text("Decline"))[role="button"]');
    }
    
    if (!finalDeclineButton) {
      // Try finding the button by its parent structure
      finalDeclineButton = await page.$('div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xeuugli.x1icxu4v.x25sj25.x10b6aqq.x1yrsyyn div[aria-label="Decline"]');
    }
    
    if (finalDeclineButton) {
      try {
        // Try force click to bypass interception
        await finalDeclineButton.click({ force: true });
        console.log("✅ Final decline button clicked with force");
      } catch (clickError) {
        console.log("⚠️ Force click failed, trying JavaScript click");
        try {
          await finalDeclineButton.evaluate(el => el.click());
          console.log("✅ Final decline button clicked via JavaScript");
        } catch (jsError) {
          console.log("❌ JavaScript click also failed:", jsError.message);
          // Try scrolling and clicking again
          await finalDeclineButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(config.getWaitTime(config.UI_SHORT_WAIT));
          await finalDeclineButton.click();
          console.log("✅ Final decline button clicked after scroll");
        }
      }
    } else {
      console.log("❌ Could not find final decline button");
    }
    
    console.log("✅ Decline with feedback process completed");
    
    // Wait after decline click with countdown
    await waitWithCountdown(page, config.getWaitTime(config.DECLINE_WAIT), `Waiting after decline`, className);
    
  } catch (error) {
    console.error("❌ Error in decline with feedback:", error.message);
    // Fallback to simple decline
    try {
      const declineButton = await memberCard.$('[aria-label*="Decline"]');
      if (declineButton) {
        await declineButton.click();
        console.log("✅ Fallback: Simple decline button clicked");
        
        // Wait after fallback decline click with countdown
        await waitWithCountdown(page, config.getWaitTime(config.DECLINE_WAIT), `Waiting after decline`, className);
      }
    } catch (fallbackError) {
      console.error("❌ Fallback decline also failed:", fallbackError.message);
    }
  }
}

// Function to decline member based on configuration
async function declineMember(page, memberCard, declineReason, className = null) {
  if (config.DECLINE_WITH_FEEDBACK) {
    console.log("📝 Using decline with feedback (config: DECLINE_WITH_FEEDBACK = true)");
    await declineWithFeedback(page, memberCard, declineReason, className);
  } else {
    console.log("⚡ Using direct decline (config: DECLINE_WITH_FEEDBACK = false)");
    await declineDirectly(page, memberCard, className);
  }
}

// Function to scrape member requests and handle approval/decline
async function scrapeMemberRequests(page, className = null) {
  try {
    console.log("🔍 Looking for member requests...");
    addLogMessage(config.INFO_LOOKING, className);
    await showToast(page, config.INFO_LOOKING, 'info', className);
    
    // Wait for member request elements to load - look for the actual member request cards
    await page.waitForSelector('[aria-label*="Approve"]', { timeout: 10000 });
    
    // Find all member request items by looking for approve buttons
    const approveButtons = await page.$$('[aria-label*="Approve"]');
    console.log(`Found ${approveButtons.length} member request(s)`);
    
    // Set total members for progress tracking
    if (isMultiTabMode && className) {
      updateTabProcessingCount(className, 0, approveButtons.length);
    } else {
      totalMembers = approveButtons.length;
      currentProcessingCount = 0;
    }
    
    if (approveButtons.length === 0) {
      console.log("❌ No member requests found");
      addLogMessage(`${config.INFO_NO_MEMBERS} - will retry in 10 minutes`, className);
      await showToast(page, config.INFO_NO_MEMBERS, 'info', className);
      return { noMembers: true };
    }
    
    addLogMessage(`Found ${approveButtons.length} member request(s)`, className);
    await showToast(page, `Found ${approveButtons.length} member request(s)`, 'info', className);
    
    // Get the parent containers of the approve buttons (these are the member request cards)
    const allMemberRequests = [];
    for (const button of approveButtons) {
      const memberCard = await button.evaluateHandle(el => {
        // Find the parent container that contains the member info
        let parent = el.closest('[role="listitem"]') || el.closest('div[class*="x1jx94hy"]');
        return parent;
      });
      if (memberCard) {
        allMemberRequests.push(memberCard);
      }
    }
    
    // MIN_REQUEST_AGE filtering removed: process all requests immediately
    const memberRequests = allMemberRequests;

    addLogMessage(`Processing ${memberRequests.length} request(s)`, className);
    await showToast(page, `Processing ${memberRequests.length} request(s)`, 'info', className);

    for (let i = 0; i < memberRequests.length; i++) {
      const currentCount = i + 1;
      const totalCount = memberRequests.length;
      
      if (isMultiTabMode && className) {
        updateTabProcessingCount(className, currentCount);
      } else {
        currentProcessingCount = currentCount;
      }
      
      console.log(`\n--- Processing Member Request ${currentCount}/${totalCount} ---`);
      addLogMessage(`Processing member ${currentCount}/${totalCount}`, className);
      await showToast(page, `Processing member ${currentCount}/${totalCount}`, 'info', className);
      
      try {
        // Extract member name and user ID from approve button aria-label and profile link
        let memberName = 'Unknown';
        let facebookUserId = '';
        
        try {
          const approveButton = await memberRequests[i].$('[aria-label*="Approve"]');
          if (approveButton) {
            const ariaLabel = await approveButton.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.includes('Approve')) {
              memberName = ariaLabel.replace('Approve ', '').trim();
            }
          }
        } catch (e) {
          console.log(`Error extracting name: ${e.message}`);
        }
        
        // Extract Facebook user ID from profile link
        try {
          // Debug: Log all links in the member request
          const allLinks = await memberRequests[i].$$('a');
          console.log(`🔍 Found ${allLinks.length} links in member request`);
          
          for (let j = 0; j < allLinks.length; j++) {
            const href = await allLinks[j].getAttribute('href');
            const text = await allLinks[j].textContent();
            console.log(`  Link ${j + 1}: ${href} (text: "${text}")`);
          }
          
          // Try multiple selectors to find the profile link
          let profileLink = await memberRequests[i].$('a[href*="/user/"]');
          
          // If not found, try looking for links with the member's name
          if (!profileLink) {
            const nameLinks = await memberRequests[i].$$('a');
            for (const link of nameLinks) {
              const href = await link.getAttribute('href');
              if (href && href.includes('/user/') && href.includes(memberName.replace(/\s+/g, ''))) {
                profileLink = link;
                break;
              }
            }
          }
          
          // If still not found, try any link with /user/ pattern
          if (!profileLink) {
            const userLinks = await memberRequests[i].$$('a[href*="/user/"]');
            if (userLinks.length > 0) {
              profileLink = userLinks[0]; // Take the first one
            }
          }
          
          if (profileLink) {
            const href = await profileLink.getAttribute('href');
            console.log(`🔍 Found profile link: ${href}`);
            
            if (href) {
              // Extract user ID from URL like /groups/2914694315405204/user/100004813517811/
              const userIdMatch = href.match(/\/user\/(\d+)/);
              if (userIdMatch) {
                facebookUserId = userIdMatch[1];
                console.log(`🆔 Facebook User ID: ${facebookUserId}`);
              } else {
                console.log(`❌ Could not extract user ID from: ${href}`);
              }
            }
          } else {
            console.log(`❌ No profile link found for member: ${memberName}`);
          }
        } catch (e) {
          console.log(`Error extracting user ID: ${e.message}`);
        }
        
        console.log(`👤 Member Name: ${memberName}`);
        addLogMessage(`Processing: ${memberName}`, className);
        
        // Initialize member data object for database logging
        const memberData = {
          memberName: memberName,
          memberUserId: null,
          memberQA: {},
          memberPhone: null,
          memberTrxId: null,
          approvalStatus: 'unknown',
          declineReason: null,
          facebookUserId: facebookUserId
        };
        
        // Look for answers in the member request
        let hasAnswers = false;
        let answers = {};
        
        // Try to find the answers list - look for the specific structure from your HTML
        const answersList = await memberRequests[i].$('ul');
        if (answersList) {
          const answerItems = await answersList.$$('li');
          console.log(`📝 Found ${answerItems.length} answer(s):`);
          
          for (const item of answerItems) {
            try {
              // Look for the question and answer structure
              const questionElement = await item.$('span:first-child');
              const answerElement = await item.$('.x1gslohp span');
              
              if (questionElement && answerElement) {
                const question = await questionElement.textContent();
                const answer = await answerElement.textContent();
                if (question && answer && question.trim() && answer.trim()) {
                  answers[question.trim()] = answer.trim();
                  console.log(`  Q: ${question.trim()}`);
                  console.log(`  A: ${answer.trim()}`);
                  hasAnswers = true;
                }
              }
            } catch (e) {
              // Continue to next item
            }
          }
        } else {
          console.log("❌ No answers list found");
        }
        
        if (!hasAnswers) {
          console.log("❌ No answers found");
        }
        
        // Find approve and decline buttons for this member
        const approveButton = await memberRequests[i].$('[aria-label*="Approve"]');
        const declineButton = await memberRequests[i].$('[aria-label*="Decline"]');
        
        if (approveButton && declineButton) {
          if (hasAnswers && Object.keys(answers).length > 0) {
            // Extract transaction ID and phone number from answers
            let transactionId = '';
            let phoneNumber = '';
            
            const answerValues = Object.values(answers);
            if (answerValues.length >= 2) {
              transactionId = answerValues[2]; // 2nd answer is transaction ID
              phoneNumber = answerValues[1]; // Last answer is phone number
            }
            
            console.log(`📱 Phone: ${phoneNumber}`);
            console.log(`💳 Transaction ID: ${transactionId}`);
            
            if (transactionId && phoneNumber) {
              // Update member data with extracted information
              memberData.memberQA = answers;
              memberData.memberPhone = phoneNumber;
              memberData.memberTrxId = transactionId;
              
              console.log("🔍 Checking payment approval in database...");
              
              try {
                // Get the correct eligible product IDs for this class
                let eligibleProductIds;
                if (isMultiTabMode && className) {
                  eligibleProductIds = config.CLASSES[className].ELIGIBLE_PRODUCT_IDS;
                } else {
                  eligibleProductIds = config.ELIGIBLE_PRODUCT_IDS;
                }
                
                // Temporarily set the config for this check
                const originalEligibleIds = config.ELIGIBLE_PRODUCT_IDS;
                config.ELIGIBLE_PRODUCT_IDS = eligibleProductIds;
                
                // Check database for payment approval and pass Facebook user ID
                const dbResult = await processPaymentApproval(phoneNumber, transactionId, facebookUserId);
                
                // Restore original config
                config.ELIGIBLE_PRODUCT_IDS = originalEligibleIds;
                
                if (dbResult.status === 'approved') {
                  console.log("✅ Payment verified in database - APPROVING member");
                  console.log(`✅ Approved ID stored: ${dbResult.approvedId}`);
                  addLogMessage(`✅ APPROVED: ${memberName}`, className);
                  await showToast(page, `✅ APPROVED: ${memberName}`, 'success', className);
                  
                  // Update member data for approved status
                  memberData.approvalStatus = 'approved';
                  memberData.memberUserId = dbResult.approvedId;
                  
                  // Save member data to database
                  await saveMemberProcessingData(page, memberData, className);
                  
                  // Log approval to JSON file
                  const approvalClassName = isMultiTabMode && className ? className : config.SELECTED_CLASS;
                  if (approvalClassName) {
                    logApprovalToJSON(approvalClassName, memberData);
                  }
                  
                  await approveButton.click();
                  console.log("✅ Member approved and payment confirmed");
                  
                  // Wait after approval with countdown
      await waitWithCountdown(page, config.getWaitTime(config.APPROVAL_WAIT), `Waiting after approval`, className);
                } else {
                  console.log("❌ Payment not found or not approved in database - DECLINING member");
                  if (dbResult.declineReason) {
                    console.log(`📝 Decline reason: ${dbResult.declineReason}`);
                    addLogMessage(`❌ DECLINED: ${memberName} - ${dbResult.declineReason}`, className);
                    await showToast(page, `❌ DECLINED: ${memberName}`, 'error', className);
                    
                    // Update member data for declined status
                    memberData.approvalStatus = 'declined';
                    memberData.declineReason = dbResult.declineReason;
                    
                    // Save member data to database
                    await saveMemberProcessingData(page, memberData, className);
                    
                    // Log decline to JSON file
                    const declineClassName = isMultiTabMode && className ? className : config.SELECTED_CLASS;
                    if (declineClassName) {
                      logDeclineToJSON(declineClassName, memberData);
                    }
                    
                    // Use configured decline method
                    await declineMember(page, memberRequests[i], dbResult.declineReason, className);
                  } else {
                    // Fallback to simple decline
                  await declineButton.click();
                    console.log("✅ Fallback: Simple decline button clicked");
                    
                    // Wait after decline with countdown
                    await waitWithCountdown(page, config.getWaitTime(config.DECLINE_WAIT), `Waiting after decline`, className);
                    addLogMessage(`❌ DECLINE FAILED: ${memberName}`, className);
                    await showToast(page, `❌ DECLINE FAILED: ${memberName}`, 'error', className);
                    
                    // Update member data for decline failure
                    memberData.approvalStatus = 'decline_failed';
                    memberData.declineReason = 'Decline button click failed';
                    
                    // Save member data to database
                    await saveMemberProcessingData(page, memberData, className);
                    
                  console.log("❌ Member declined due to payment verification failure");
                  }
                }
              } catch (dbError) {
                console.error("❌ Database error during payment check:", dbError.message);
                console.log("❌ Terminating execution due to database error");
                addLogMessage(`❌ DB ERROR: ${memberName} - Terminating execution`, className);
                await showToast(page, `❌ DB ERROR: Terminating execution`, 'error', className);
                
                // Terminate execution - return early from function
                return { error: true, message: 'Database error - execution terminated' };
              }
            } else {
              console.log("❌ Missing transaction ID or phone number - DECLINING");
              let dbErrorMessage
              if(!phoneNumber && !transactionId){
                dbErrorMessage = config.DECLINE_MISSING_BOTH;
              }else if(!phoneNumber){
                dbErrorMessage = config.DECLINE_MISSING_PHONE;
              }else if(!transactionId){
                dbErrorMessage = config.DECLINE_MISSING_TRANSACTION;
              }else{
                dbErrorMessage = config.DECLINE_MISSING_BOTH;
              }
              addLogMessage(`❌ MISSING INFO: ${memberName} - ${dbErrorMessage}`, className);
              await showToast(page, `❌ MISSING INFO: ${memberName}`, 'error', className);
              
              // Update member data with available info and missing info status
              memberData.memberQA = answers;
              memberData.memberPhone = phoneNumber;
              memberData.memberTrxId = transactionId;
              memberData.approvalStatus = 'missing_info';
              memberData.declineReason = dbErrorMessage;
              
              // Save member data to database
              await saveMemberProcessingData(page, memberData, className);
              
              // Log decline to JSON file
              const missingInfoClassName = isMultiTabMode && className ? className : config.SELECTED_CLASS;
              if (missingInfoClassName) {
                logDeclineToJSON(missingInfoClassName, memberData);
              }
              
              await declineMember(page, memberRequests[i], dbErrorMessage, className);
              console.log("❌ Decline button clicked");
            }
          } else {
            console.log("❌ Member has no answers - DECLINING");
            addLogMessage(`❌ NO ANSWERS: ${memberName}`, className);
            await showToast(page, `❌ NO ANSWERS: ${memberName}`, 'error', className);
            
            // Update member data for no answers status
            memberData.approvalStatus = 'no_answers';
            memberData.declineReason = config.DECLINE_NO_ANSWERS;
            
            // Save member data to database
            await saveMemberProcessingData(page, memberData, className);
            
            // Log decline to JSON file
            const noAnswersClassName = isMultiTabMode && className ? className : config.SELECTED_CLASS;
            if (noAnswersClassName) {
              logDeclineToJSON(noAnswersClassName, memberData);
            }
            
            const dbErrorMessage = memberData.declineReason;
            await declineMember(page, memberRequests[i], dbErrorMessage, className);
            console.log("❌ Decline button clicked");
          }
        } else {
          console.log("⚠️ Could not find approve/decline buttons for this member");
          addLogMessage(`⚠️ NO BUTTONS: ${memberName}`, className);
          await showToast(page, `⚠️ NO BUTTONS: ${memberName}`, 'error', className);
        }
        
      } catch (memberError) {
        console.error(`❌ Error processing member request ${i + 1}:`, memberError.message);
        addLogMessage(`❌ PROCESSING ERROR: ${memberError.message}`, className);
        await showToast(page, `❌ PROCESSING ERROR`, 'error', className);
      }
    }
    
    // All members processed
    const processedCount = isMultiTabMode && className ? 
      (tabData.has(className) ? tabData.get(className).totalMembers : memberRequests.length) : 
      totalMembers;
    addLogMessage(`✅ ${config.SUCCESS_COMPLETED} ${processedCount} members`, className);
    await showToast(page, `✅ ${config.SUCCESS_COMPLETED} ${processedCount} members`, 'success', className);
    
  } catch (error) {
    console.error("❌ Error scraping member requests:", error.message);
    addLogMessage(`❌ Error: ${error.message}`, className);
    await showToast(page, `❌ Error: ${error.message}`, 'error', className);
    return { noMembers: true };
  }
}

// Class-specific automation loop with sleep/retry cycle
async function startClassAutomationLoop(page, className) {
  let cycleCount = 0;
  let noMembersCycleCount = 0;
  
  console.log(`🎯 Starting automation loop for: ${className}`);
  addLogMessage(`Starting automation loop for: ${className}`, className);
  await showToast(page, `Starting automation for ${className}`, 'info', className);
  
  while (true) {
    try {
      cycleCount++;
      console.log(`\n🔄 [${className}] Starting automation cycle ${cycleCount}`);
      addLogMessage(`Starting automation cycle ${cycleCount}`, className);
      await showToast(page, `Starting automation cycle ${cycleCount}`, 'info', className);
      
      // Scrape member request information for this specific class
      const result = await scrapeMemberRequests(page, className);
      console.log(`🔍 Debug [${className}]: scrapeMemberRequests result:`, result);
      
      if (result && result.noMembers) {
        noMembersCycleCount++;
        console.log(`💤 [${className}] No members found (cycle ${noMembersCycleCount})`);
        addLogMessage(`No members found (cycle ${noMembersCycleCount})`, className);
        
        // Check if we should auto-quit IMMEDIATELY
        const shouldQuit = config.AUTO_QUIT_WHEN_NO_REQUESTS && 
            (config.AUTO_QUIT_MAX_CYCLES === 0 || noMembersCycleCount >= config.AUTO_QUIT_MAX_CYCLES);
        console.log(`🔍 Debug: shouldQuit = ${shouldQuit} (AUTO_QUIT_WHEN_NO_REQUESTS: ${config.AUTO_QUIT_WHEN_NO_REQUESTS}, AUTO_QUIT_MAX_CYCLES: ${config.AUTO_QUIT_MAX_CYCLES}, noMembersCycleCount: ${noMembersCycleCount})`);
        
        if (shouldQuit) {
          console.log(`🚪 [${className}] Auto-quit triggered: No members found for ${noMembersCycleCount} consecutive cycles`);
          addLogMessage(`🚪 Auto-quit: No members for ${noMembersCycleCount} cycles`, className);
          await showToast(page, `${config.INFO_AUTO_QUIT_TRIGGERED} (${noMembersCycleCount} cycles)`, 'info', className);
          
          // Remove from tab data tracking
          if (tabData.has(className)) {
            tabData.delete(className);
          }
          
          // Close the page and exit
          await page.close();
          console.log(`✅ [${className}] Tab closed due to auto-quit`);
          return; // Exit the automation loop
        }
        
        // Show countdown if approaching auto-quit
        if (config.AUTO_QUIT_WHEN_NO_REQUESTS && config.AUTO_QUIT_MAX_CYCLES > 0) {
          const cyclesLeft = config.AUTO_QUIT_MAX_CYCLES - noMembersCycleCount;
          if (cyclesLeft > 0 && cyclesLeft <= 2) {
            await showToast(page, `${config.INFO_AUTO_QUIT_COUNTDOWN}: ${cyclesLeft} cycles left`, 'info', className);
          } else {
            await showToast(page, "No members found, sleeping...", 'info', className);
          }
        } else {
          await showToast(page, "No members found, sleeping...", 'info', className);
        }
        
        const noMembersWait = config.getWaitTime(config.NO_MEMBERS_WAIT);
        console.log(`💤 [${className}] Sleeping for ${noMembersWait/1000} seconds...`);
        addLogMessage(`Sleeping for ${noMembersWait/1000} seconds...`, className);
        
        // Sleep for configured time
        await page.waitForTimeout(noMembersWait);
        
        console.log(`⏰ [${className}] Sleep period ended, checking for new members...`);
        addLogMessage("Sleep period ended, checking for new members...", className);
        await showToast(page, "Checking for new members...", 'info', className);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(config.getWaitTime(config.PAGE_RELOAD_WAIT));
      } else {
        // Members were processed, reset no-members counter
        noMembersCycleCount = 0;
        
        // Members were processed, wait a bit before next cycle
        const betweenMembersWait = config.getWaitTime(config.BETWEEN_MEMBERS_WAIT);
        console.log(`⏳ [${className}] Waiting ${betweenMembersWait/1000} seconds before next check...`);
        addLogMessage(`Waiting ${betweenMembersWait/1000} seconds before next check...`, className);
        await showToast(page, config.INFO_WAITING, 'info', className);
        await page.waitForTimeout(betweenMembersWait);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(config.getWaitTime(config.PAGE_RELOAD_WAIT));
      }
      
    } catch (error) {
      console.error(`❌ [${className}] Error in automation loop:`, error.message);
      addLogMessage(`❌ Automation loop error: ${error.message}`, className);
      await showToast(page, `❌ Automation loop error`, 'error', className);
      
      // Wait configured time before retrying
      const retryWait = config.getWaitTime(config.RETRY_WAIT);
      console.log(`⏳ [${className}] Waiting ${retryWait/1000} seconds before retrying...`);
      await page.waitForTimeout(retryWait);
    }
  }
}

// Multi-class automation function
async function startMultiClassAutomation(context, chromePath, userDataDir, profile, classNamesToProcess = null) {
  console.log('\n🚀 Starting Multi-Class Automation');
  console.log('===================================');
  
  // We still use "multi-tab mode" internals for class-specific config/logging,
  // but we process classes SEQUENTIALLY (one tab at a time).
  isMultiTabMode = true;
  
  // Get all configured classes
  const availableClasses = config.getAvailableClasses();
  const configuredClasses = Array.isArray(classNamesToProcess)
    ? classNamesToProcess
    : availableClasses.filter(className => {
        const classConfig = config.CLASSES[className];
        return classConfig.GROUP_URL && classConfig.ELIGIBLE_PRODUCT_IDS.length > 0;
      });
  
  // Initialize group completion tracking
  totalClasses = configuredClasses.length;
  completedClasses = 0;
  
  console.log(`📋 Processing ${configuredClasses.length} configured classes:`);
  configuredClasses.forEach(className => {
    console.log(`  - ${className}`);
  });
  
  // Process ONE class at a time: open tab -> run automation loop -> tab auto-closes -> next class
  for (const className of configuredClasses) {
    try {
      console.log(`\n🔗 Opening tab for: ${className} (sequential)`);
      
      // Create new page for this class
      const page = await context.newPage();
      
      // Initialize tab data
      initializeTabData(className, page);
      
      // Navigate to the class-specific group URL
      const classConfig = config.CLASSES[className];
      console.log(`📍 [${className}] Navigating to: ${classConfig.GROUP_URL}`);
      
      await page.goto(classConfig.GROUP_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      
      console.log(`✅ [${className}] Tab opened and navigated successfully`);
      
      // Wait a bit for the page to load
      await page.waitForTimeout(config.getWaitTime(config.PAGE_LOAD_WAIT));
      
      // Run automation loop for this class and WAIT until it finishes (auto-quit closes the tab)
      await startClassAutomationLoop(page, className);
      console.log(`🏁 Finished: ${className}`);
      
      // Update completed classes count
      completedClasses++;
      console.log(`📊 Progress: ${completedClasses}/${totalClasses} groups completed`);
      
      // Small delay before moving to next class
      await new Promise(resolve => setTimeout(resolve, config.getWaitTime(config.CLASS_SWITCH_WAIT)));
      
    } catch (error) {
      console.error(`❌ Error setting up automation for ${className}:`, error.message);
    }
  }

  console.log(`\n✅ Completed sequential processing for ${configuredClasses.length} classes.`);
  
  // Cleanup: Close all remaining tabs (including about:blank)
  console.log('\n🚪 Cleaning up remaining tabs after all classes completed...');
  const remainingPages = context.pages();
  for (const remainingPage of remainingPages) {
    try {
      const url = remainingPage.url();
      console.log(`🔍 Closing tab: ${url}`);
      await remainingPage.close();
      console.log('✅ Closed tab');
    } catch (error) {
      console.log(`⚠️ Error closing tab: ${error.message}`);
    }
  }
  console.log('✅ All tabs closed after multi-class automation.');
  
  // Wait a bit for cleanup before closing context
  await new Promise(resolve => setTimeout(resolve, config.getWaitTime(config.CLEANUP_WAIT) / 2));
}

function parseBooleanEnv(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return String(value).toLowerCase() === "true";
}

function resolveDefaultChromeExecutablePath() {
  const platform = process.platform;

  if (platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  if (platform === "win32") {
    // Prefer standard install location. If user has a different one, set CHROME_EXECUTABLE_PATH.
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }

  // Linux/common fallback — rely on Playwright channel/bundled Chromium
  return null;
}

function resolveUserDataDirFromEnvOrDefault() {
  const configured = process.env.CHROME_USER_DATA_DIR;
  if (configured && configured.trim()) {
    // Allow relative paths in env (cross-platform friendly)
    return path.isAbsolute(configured) ? configured : path.resolve(__dirname, configured);
  }
  // Cross-platform default: keep browser profile inside the repo
  return path.resolve(__dirname, ".chrome-profile");
}

async function launchPersistentContextWithFallback({ userDataDir, headless, args, timeout }) {
  const baseOptions = {
    headless,
    args,
    timeout,
  };

  const executablePathFromEnv = (process.env.CHROME_EXECUTABLE_PATH || "").trim();
  if (executablePathFromEnv) {
    if (!fs.existsSync(executablePathFromEnv)) {
      throw new Error(`CHROME_EXECUTABLE_PATH not found: ${executablePathFromEnv}`);
    }
    console.log("🌐 Using Chrome via CHROME_EXECUTABLE_PATH");
    return await chromium.launchPersistentContext(userDataDir, {
      ...baseOptions,
      executablePath: executablePathFromEnv,
    });
  }

  // Try Playwright "chrome" channel (uses installed Chrome on Windows/macOS)
  try {
    console.log('🌐 Trying Playwright channel: "chrome"');
    return await chromium.launchPersistentContext(userDataDir, {
      ...baseOptions,
      channel: "chrome",
    });
  } catch (e) {
    console.warn(`⚠️ Could not launch channel "chrome": ${e.message}`);
  }

  // Try default Chrome path if it exists (Windows/macOS)
  const defaultChromePath = resolveDefaultChromeExecutablePath();
  if (defaultChromePath && fs.existsSync(defaultChromePath)) {
    console.log("🌐 Using system Chrome from default path");
    return await chromium.launchPersistentContext(userDataDir, {
      ...baseOptions,
      executablePath: defaultChromePath,
    });
  }

  // Final fallback: bundled Playwright Chromium (works everywhere after `npx playwright install`)
  console.log("🌐 Falling back to bundled Playwright Chromium");
  return await chromium.launchPersistentContext(userDataDir, baseOptions);
}

// Main automation loop with sleep/retry cycle (for single class)
async function startAutomationLoop(page) {
  let cycleCount = 0;
  let noMembersCycleCount = 0;
  
  while (true) {
    try {
      cycleCount++;
      console.log(`\n🔄 Starting automation cycle ${cycleCount}`);
      addLogMessage(`Starting automation cycle ${cycleCount}`);
      await showToast(page, `Starting automation cycle ${cycleCount}`, 'info');
      
      // Scrape member request information
      const result = await scrapeMemberRequests(page);
      console.log(`🔍 Debug: scrapeMemberRequests result:`, result);
      
      if (result && result.noMembers) {
        noMembersCycleCount++;
        console.log(`💤 No members found (cycle ${noMembersCycleCount})`);
        addLogMessage(`No members found (cycle ${noMembersCycleCount})`);
        
        // Check if we should auto-quit IMMEDIATELY
        const shouldQuit = config.AUTO_QUIT_WHEN_NO_REQUESTS && 
            (config.AUTO_QUIT_MAX_CYCLES === 0 || noMembersCycleCount >= config.AUTO_QUIT_MAX_CYCLES);
        console.log(`🔍 Debug: shouldQuit = ${shouldQuit} (AUTO_QUIT_WHEN_NO_REQUESTS: ${config.AUTO_QUIT_WHEN_NO_REQUESTS}, AUTO_QUIT_MAX_CYCLES: ${config.AUTO_QUIT_MAX_CYCLES}, noMembersCycleCount: ${noMembersCycleCount})`);
        
        if (shouldQuit) {
          console.log(`🚪 Auto-quit triggered: No members found for ${noMembersCycleCount} consecutive cycles`);
          addLogMessage(`🚪 Auto-quit: No members for ${noMembersCycleCount} cycles`);
          await showToast(page, `${config.INFO_AUTO_QUIT_TRIGGERED} (${noMembersCycleCount} cycles)`, 'info');
          
          // Close the page and exit
          await page.close();
          console.log("✅ Tab closed due to auto-quit");
          return; // Exit the automation loop
        }
        
        // Show countdown if approaching auto-quit
        if (config.AUTO_QUIT_WHEN_NO_REQUESTS && config.AUTO_QUIT_MAX_CYCLES > 0) {
          const cyclesLeft = config.AUTO_QUIT_MAX_CYCLES - noMembersCycleCount;
          if (cyclesLeft > 0 && cyclesLeft <= 2) {
            await showToast(page, `${config.INFO_AUTO_QUIT_COUNTDOWN}: ${cyclesLeft} cycles left`, 'info');
          } else {
            await showToast(page, "No members found, sleeping...", 'info');
          }
        } else {
          await showToast(page, "No members found, sleeping...", 'info');
        }
        
        const noMembersWait = config.getWaitTime(config.NO_MEMBERS_WAIT);
        console.log(`💤 Sleeping for ${noMembersWait/1000} seconds...`);
        addLogMessage(`Sleeping for ${noMembersWait/1000} seconds...`);
        
        // Sleep for configured time
        await page.waitForTimeout(noMembersWait);
        
        console.log("⏰ Sleep period ended, checking for new members...");
        addLogMessage("Sleep period ended, checking for new members...");
        await showToast(page, "Checking for new members...", 'info');
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(config.getWaitTime(config.PAGE_RELOAD_WAIT));
      } else {
        // Members were processed, reset no-members counter
        noMembersCycleCount = 0;
        
        // Members were processed, wait a bit before next cycle
        const betweenMembersWait = config.getWaitTime(config.BETWEEN_MEMBERS_WAIT);
        console.log(`⏳ Waiting ${betweenMembersWait/1000} seconds before next check...`);
        addLogMessage(`Waiting ${betweenMembersWait/1000} seconds before next check...`);
        await showToast(page, config.INFO_WAITING, 'info');
        await page.waitForTimeout(betweenMembersWait);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(config.getWaitTime(config.PAGE_RELOAD_WAIT));
      }
      
    } catch (error) {
      console.error("❌ Error in automation loop:", error.message);
      addLogMessage(`❌ Automation loop error: ${error.message}`);
      await showToast(page, `❌ Automation loop error`, 'error');
      
      // Wait configured time before retrying
      const retryWait = config.getWaitTime(config.RETRY_WAIT);
      console.log(`⏳ Waiting ${retryWait/1000} seconds before retrying...`);
      await page.waitForTimeout(retryWait);
    }
  }
}

(async () => {
  try {
    // Initialize reports for all existing log folders
    console.log("📊 Initializing reports for existing log folders...");
    initializeReportsForAllLogFolders();
    
    // First, prompt user to select a class
    console.log("🚀 Starting Facebook Automation System");
    console.log("======================================");
    
    const selectedClass = await promptClassSelection();
    if (!selectedClass) {
      console.log("\n❌ No class selected or class not configured. Exiting...");
      process.exit(1);
    }
    
    // Handle Facebook personal use (just open browser, no automation)
    if (selectedClass === 'FACEBOOK_PERSONAL') {
      console.log(`\n🌐 Opening Facebook.com for personal use`);
      console.log("======================================\n");
    }
    // Handle multi-class selection
    else if (selectedClass === 'ALL_CLASSES' || selectedClass === 'YEAR_2025' || selectedClass === 'YEAR_2026') {
      const label =
        selectedClass === 'ALL_CLASSES'
          ? 'ALL CLASSES'
          : selectedClass === 'YEAR_2025'
            ? 'ALL Year 2025 CLASSES'
            : 'ALL Year 2026 CLASSES';
      console.log(`\n🎯 Starting automation for: ${label} (Multi-tab mode)`);
      console.log("======================================\n");
    } else {
      console.log(`\n🎯 Starting automation for: ${selectedClass}`);
      console.log(`📍 Group URL: ${config.GROUP_URL}`);
      console.log(`🆔 Eligible Product IDs: ${config.ELIGIBLE_PRODUCT_IDS.length} items`);
      console.log("======================================\n");
    }

    const headless = parseBooleanEnv(process.env.HEADLESS, false);
    const userDataDir = resolveUserDataDirFromEnvOrDefault();
    const chromeProfileDir = (process.env.CHROME_PROFILE_DIR || "").trim(); // Optional: "Default", "Profile 1", etc.

    // Ensure user data dir exists (Playwright will create, but making it explicit is clearer)
    fs.mkdirSync(userDataDir, { recursive: true });

    console.log("Starting Facebook automation...");
    console.log("OS:", `${os.platform()} (${process.platform})`);
    console.log("User data directory:", userDataDir);
    if (chromeProfileDir) console.log("Chrome profile dir:", chromeProfileDir);
    console.log("Headless:", headless);

    const launchArgs = [
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
    ];

    // If the user points to their real Chrome User Data folder, allow selecting a profile directory
    if (chromeProfileDir) {
      launchArgs.push(`--profile-directory=${chromeProfileDir}`);
    }

    console.log("Launching browser...");

    const context = await launchPersistentContextWithFallback({
      userDataDir,
      headless,
      args: launchArgs,
      timeout: 30000,
    });

    console.log("Chrome launched successfully!");

    // Handle Facebook personal use (just open browser, no automation)
    if (selectedClass === 'FACEBOOK_PERSONAL') {
      // Check existing pages
      const pages = context.pages();
      let page;
      if (pages.length > 0) {
        page = pages[0];
        console.log("Using existing page");
      } else {
        page = await context.newPage();
        console.log("Created new page");
      }

      // Function to check if browser is closed and exit if so
      const checkAndExitIfClosed = async () => {
        try {
          const currentPages = context.pages();
          const activePages = currentPages.filter(p => !p.isClosed());
          
          // If no active pages remain, the browser was closed
          if (activePages.length === 0) {
            console.log('\n🚪 Browser closed by user. Exiting...');
            try {
              await context.close();
            } catch (e) {
              // Context might already be closed
            }
            console.log('✅ Process terminated.');
            process.exit(0);
          }
        } catch (error) {
          // Context might be closed, exit
          console.log('\n🚪 Browser closed. Exiting...');
          process.exit(0);
        }
      };

      // Listen for browser context close event to exit process
      context.on('close', () => {
        console.log('\n🚪 Browser context closed. Exiting...');
        console.log('✅ Process terminated.');
        process.exit(0);
      });

      // Listen for page close events - if all pages are closed, exit
      page.on('close', async () => {
        await checkAndExitIfClosed();
      });

      // Poll periodically to check if browser is closed (fallback for manual closes)
      const checkInterval = setInterval(async () => {
        await checkAndExitIfClosed();
      }, 1000); // Check every second

      // Clean up interval on process exit
      process.on('exit', () => {
        clearInterval(checkInterval);
      });

      // Navigate to Facebook.com
      console.log("Navigating to Facebook.com...");
      try {
        await page.goto('https://www.facebook.com', {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        console.log("✅ Facebook.com opened successfully!");
        console.log("🌐 Browser is open. You can now use it for personal use.");
        console.log("📝 Script will terminate when you close the browser.");
        console.log("======================================\n");
        
        // Keep the process running until browser is closed
        // The event listeners and polling above will handle cleanup and exit
      } catch (error) {
        console.error("❌ Error navigating to Facebook.com:", error.message);
        console.log("📝 Script will terminate when you close the browser.");
        // Still set up event listeners for cleanup
      }
    }

    // Handle multi-class vs single class automation
    if (selectedClass === 'ALL_CLASSES' || selectedClass === 'YEAR_2025' || selectedClass === 'YEAR_2026') {
      const classList =
        selectedClass === 'YEAR_2025'
          ? config.getConfiguredClassesByYear(2025)
          : selectedClass === 'YEAR_2026'
            ? config.getConfiguredClassesByYear(2026)
            : null;
      // Start multi-class automation (optionally filtered)
      await startMultiClassAutomation(context, null, userDataDir, chromeProfileDir, classList);
      
      // Cleanup after multi-class automation completes
      console.log('\n🚪 Cleaning up after all classes completed...');
      const finalPages = context.pages();
      for (const finalPage of finalPages) {
        try {
          const url = finalPage.url();
          console.log(`🔍 Closing tab: ${url}`);
          await finalPage.close();
          console.log('✅ Closed tab');
        } catch (error) {
          console.log(`⚠️ Error closing tab: ${error.message}`);
        }
      }
      
      // Wait for cleanup before closing context gracefully
      console.log('⏳ Waiting for cleanup...');
      await new Promise(resolve => setTimeout(resolve, config.getWaitTime(config.CLEANUP_WAIT)));
      
      // Close the browser context gracefully
      // For persistent contexts, we close gracefully to avoid macOS crash reports
      try {
        // Give the browser a moment to finish any pending operations
        await new Promise(resolve => setTimeout(resolve, config.getWaitTime(config.UI_SHORT_WAIT)));
        await context.close();
        console.log('✅ Browser context closed gracefully.');
      } catch (error) {
        console.log(`⚠️ Error closing context: ${error.message}`);
        // If close fails, the process will exit naturally and context will close
      }
      
      console.log('✅ All tasks completed. Process ended successfully.');
    } else {
      // Single class automation - use existing logic
      
      // Check existing pages
      const pages = context.pages();
      console.log("Existing pages:", pages.length);
      
      // Use existing page if available, otherwise create new one
      let page;
      if (pages.length > 0) {
        page = pages[0];
        console.log("Using existing page");
      } else {
        page = await context.newPage();
        console.log("Created new page");
      }

      // Go to Facebook with timeout and error handling
      console.log("Navigating to Facebook...");
      try {
        await page.goto(
          config.GROUP_URL,
          {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          }
        );
        console.log("Facebook opened successfully with profile:", profile);
        
        // Wait a bit to see the page
        await page.waitForTimeout(config.getWaitTime(config.PAGE_LOAD_WAIT));
        
        // Check if we're actually on Facebook
        const currentUrl = page.url();
        console.log("Current URL:", currentUrl);
        
        if (currentUrl.includes('facebook.com')) {
          console.log("✅ Successfully navigated to Facebook!");
          
          // Wait for the page to fully load
          await page.waitForTimeout(config.getWaitTime(config.INITIAL_PAGE_LOAD_WAIT));
          
          // Start the main automation loop
          await startAutomationLoop(page);
          
          // Cleanup after automation loop ends (due to auto-quit)
          console.log('\n🚪 Automation loop ended. Cleaning up remaining tabs...');
          const remainingPages = context.pages();
          
          // Close all remaining pages (including about:blank tabs)
          for (const remainingPage of remainingPages) {
            try {
              const url = remainingPage.url();
              console.log(`🔍 Closing tab: ${url}`);
              await remainingPage.close();
              console.log('✅ Closed tab');
            } catch (error) {
              console.log(`⚠️ Error closing tab: ${error.message}`);
            }
          }
          
          // Wait for cleanup before closing context gracefully
          console.log('⏳ Waiting for cleanup...');
          await new Promise(resolve => setTimeout(resolve, config.getWaitTime(config.CLEANUP_WAIT)));
          
          // Close the browser context gracefully
          // For persistent contexts, we close gracefully to avoid macOS crash reports
          try {
            // Give the browser a moment to finish any pending operations
            await new Promise(resolve => setTimeout(resolve, 500));
            await context.close();
            console.log('✅ Browser context closed gracefully.');
          } catch (error) {
            console.log(`⚠️ Error closing context: ${error.message}`);
            // If close fails, the process will exit naturally and context will close
          }
          
          console.log('✅ All tabs closed. Process ended successfully.');
          return;
          
        } else {
          console.log("⚠️ Warning: Not on Facebook. Current URL:", currentUrl);
        }
        
      } catch (navigationError) {
        console.error("⚠️ Navigation timeout, but checking if page loaded:", navigationError.message);
        console.log("Current URL:", page.url());
        
        // Try to get page title for debugging
        try {
          const title = await page.title();
          console.log("Page title:", title);
          
          // If we're on Facebook, continue with automation
          if (page.url().includes('facebook.com')) {
            console.log("✅ Page loaded successfully, continuing with automation...");
            
            // Wait for the page to fully load
            await page.waitForTimeout(config.getWaitTime(config.INITIAL_PAGE_LOAD_WAIT));
            
            // Start the main automation loop
            await startAutomationLoop(page);
            
            // Cleanup after automation loop ends (due to auto-quit)
            console.log('\n🚪 Automation loop ended. Cleaning up remaining tabs...');
            const remainingPages = context.pages();
            
            // Close all remaining pages (including about:blank tabs)
            for (const remainingPage of remainingPages) {
              try {
                const url = remainingPage.url();
                console.log(`🔍 Closing tab: ${url}`);
                await remainingPage.close();
                console.log('✅ Closed tab');
              } catch (error) {
                console.log(`⚠️ Error closing tab: ${error.message}`);
              }
            }
            
            // Wait for cleanup before closing context gracefully
            console.log('⏳ Waiting for cleanup...');
            await new Promise(resolve => setTimeout(resolve, config.getWaitTime(config.CLEANUP_WAIT)));
            
            // Close the browser context gracefully
            try {
              await context.close({ reason: 'Automation completed successfully' });
              console.log('✅ Browser context closed gracefully.');
            } catch (error) {
              console.log(`⚠️ Error closing context: ${error.message}`);
            }
            
            console.log('✅ All tabs closed. Process ended successfully.');
            return;
          }
        } catch (titleError) {
          console.log("Could not get page title:", titleError.message);
          throw navigationError;
        }
      }
    }
    
  } catch (error) {
    console.error("Error occurred:", error.message);
    console.error("Full error:", error);
  }
})();
