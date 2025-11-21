// filename: facebook-profile.js
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
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

// JSON Logging Functions
// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to sanitize class name for file naming
function sanitizeClassName(className) {
  return className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

// Function to log approval to JSON file
function logApprovalToJSON(className, memberData) {
  try {
    const sanitizedClassName = sanitizeClassName(className);
    const logFile = path.join(logsDir, `${sanitizedClassName}_approvals.json`);
    
    // Create log entry with all available data
    const logEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString(),
      className: className,
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
    
  } catch (error) {
    console.error('❌ Error logging approval to JSON:', error.message);
  }
}

// Function to log decline to JSON file
function logDeclineToJSON(className, memberData) {
  try {
    const sanitizedClassName = sanitizeClassName(className);
    const logFile = path.join(logsDir, `${sanitizedClassName}_declines.json`);
    
    // Create log entry with all available data
    const logEntry = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString(),
      className: className,
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
    console.log('0. 🚀 ALL CLASSES (Multi-tab processing)');
    console.log('Available classes:');
    
    const availableClasses = config.getAvailableClasses();
    availableClasses.forEach((className, index) => {
      console.log(`${index + 1}. ${className}`);
    });
    
    console.log('=====================================');
    
    const askForClass = () => {
      rl.question('\nWhich class do you want to start the operation for? (Enter number or class name): ', (answer) => {
        let selectedClass = null;
        
        // Check for option 0 (all classes)
        if (answer === '0' || answer.toLowerCase() === 'all' || answer.toLowerCase() === 'all classes') {
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
    await page.evaluate(({ msg, msgType, progress, total, logs, className, isMultiTab }) => {
      const toast = document.getElementById('fb-automation-toast');
      if (toast) {
        const timestamp = new Date().toLocaleTimeString();
        const progressText = total > 0 ? `Processing ${progress}/${total}` : 'Processing...';
        const classText = isMultiTab && className ? ` - ${className}` : '';
        
        toast.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">
            🤖 FB Automation${classText} - ${progressText}
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
      isMultiTab: isMultiTabMode
    });

  } catch (error) {
    console.error('Error showing toast:', error.message);
  }
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

// Function to parse request time and check if it's too recent
function isRequestTooRecent(timeText) {
  if (!timeText) return false;
  
  const minAgeMinutes = config.MIN_REQUEST_AGE_MINUTES || 3;
  
  // Convert text to lowercase for easier matching
  const text = timeText.toLowerCase();
  
  // Check for "a few seconds ago" or similar instant patterns
  if (text.includes('few seconds') || text.includes('just now') || text.includes('seconds ago')) {
    console.log(`⏰ Request is too recent: "${timeText}" (less than 1 minute)`);
    return true;
  }
  
  // Extract minutes from patterns like "1 minute ago", "2 minutes ago", "1m", "2m"
  const minutePatterns = [
    /(\d+)\s*minute[s]?\s*ago/i,
    /(\d+)\s*min[s]?\s*ago/i,
    /(\d+)m\s*ago/i,
    /(\d+)\s*m$/i
  ];
  
  for (const pattern of minutePatterns) {
    const match = text.match(pattern);
    if (match) {
      const minutes = parseInt(match[1]);
      if (minutes < minAgeMinutes) {
        console.log(`⏰ Request is too recent: "${timeText}" (${minutes} minutes < ${minAgeMinutes} minutes required)`);
        return true;
      }
      console.log(`✅ Request is old enough: "${timeText}" (${minutes} minutes >= ${minAgeMinutes} minutes required)`);
      return false;
    }
  }
  
  // If we can't parse it, assume it's old enough (hours, days, weeks, etc.)
  if (text.includes('hour') || text.includes('day') || text.includes('week') || text.includes('month') || text.includes('year')) {
    console.log(`✅ Request is old enough: "${timeText}" (more than ${minAgeMinutes} minutes)`);
    return false;
  }
  
  // If we still can't determine, be conservative and skip it
  console.log(`⚠️ Could not parse request time: "${timeText}" - skipping to be safe`);
  return true;
}

// Function to extract and check request time from member card
async function checkRequestTime(memberCard) {
  try {
    const requestTime = await memberCard.evaluate(el => {
      // Look for time text in various possible locations
      const timeSelectors = [
        'abbr',
        '[role="link"] span',
        'span[class*="x193iq5w"]',
        'span[class*="x1lliihq"]',
        'span'
      ];
      
      for (const selector of timeSelectors) {
        const timeElements = el.querySelectorAll(selector);
        for (const elem of timeElements) {
          const text = elem.textContent || elem.innerText;
          // Check if this looks like a time indicator
          if (text && (
            text.includes('ago') || 
            text.includes('minute') || 
            text.includes('hour') || 
            text.includes('day') ||
            text.includes('week') ||
            text.includes('month') ||
            /\d+[mhd]/.test(text) // Matches patterns like "3m", "2h", "1d"
          )) {
            return text.trim();
          }
        }
      }
      return null;
    });
    
    if (!requestTime) {
      // If we can't find the time, assume it's old enough
      return { shouldSkip: false, requestAge: 'unknown' };
    }
    
    // Parse the time text
    const text = requestTime.toLowerCase();
    const minAgeMinutes = config.MIN_REQUEST_AGE_MINUTES || 3;
    
    // Check for "a few seconds ago" or similar instant patterns
    if (text.includes('few seconds') || text.includes('just now') || text.includes('second')) {
      return { shouldSkip: true, requestAge: '< 1' };
    }
    
    // Extract minutes
    const minutePatterns = [
      /(\d+)\s*minute[s]?\s*ago/i,
      /(\d+)\s*min[s]?\s*ago/i,
      /(\d+)m\s*ago/i,
      /(\d+)\s*m\s/i
    ];
    
    for (const pattern of minutePatterns) {
      const match = text.match(pattern);
      if (match) {
        const minutes = parseInt(match[1]);
        // Skip patterns like "0m", "0d", "0w" which are invalid
        if (minutes === 0) {
          console.log(`⚠️ Invalid time pattern: "${requestTime}" - treating as old enough`);
          return { shouldSkip: false, requestAge: 'invalid-zero' };
        }
        if (minutes < minAgeMinutes) {
          return { shouldSkip: true, requestAge: minutes };
        }
        return { shouldSkip: false, requestAge: minutes };
      }
    }
    
    // Check for hour/day/week patterns (these are definitely old enough)
    const longTimePatterns = [
      /(\d+)\s*hour[s]?\s*ago/i,
      /(\d+)\s*h\s*ago/i,
      /(\d+)\s*day[s]?\s*ago/i,
      /(\d+)\s*d\s*ago/i,
      /(\d+)\s*week[s]?\s*ago/i,
      /(\d+)\s*w\s*ago/i
    ];
    
    for (const pattern of longTimePatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        // Skip patterns like "0h", "0d", "0w" which are invalid
        if (value === 0) {
          console.log(`⚠️ Invalid time pattern: "${requestTime}" - treating as old enough`);
          return { shouldSkip: false, requestAge: 'invalid-zero' };
        }
        // Any hour, day, or week value >= 1 is definitely old enough
        console.log(`✅ Request is old enough: "${requestTime}"`);
        return { shouldSkip: false, requestAge: requestTime };
      }
    }
    
    // If it includes these words without numbers, assume it's old enough
    if (text.includes('hour') || text.includes('day') || text.includes('week') || text.includes('month') || text.includes('year')) {
      console.log(`✅ Request is old enough: "${requestTime}"`);
      return { shouldSkip: false, requestAge: requestTime };
    }
    
    // If we can't parse it, assume it's old enough (safer to process)
    console.log(`⚠️ Could not parse time format: "${requestTime}" - treating as old enough`);
    return { shouldSkip: false, requestAge: 'unknown-format' };
    
  } catch (error) {
    console.log(`⚠️ Error checking request time: ${error.message}`);
    // If there's an error, don't skip the request
    return { shouldSkip: false, requestAge: 'error' };
  }
}


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
async function declineDirectly(page, memberCard) {
  try {
    console.log("🔄 Starting direct decline process...");
    
    // Find the decline button directly
    const declineButton = await memberCard.$('[aria-label*="Decline"]');
    if (declineButton) {
      await declineButton.click();
      console.log("✅ Direct decline button clicked");
    } else {
      console.log("❌ Decline button not found");
    }
  } catch (error) {
    console.error("❌ Error in direct decline:", error.message);
  }
}

// Function to decline member with feedback
async function declineWithFeedback(page, memberCard, declineReason) {
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
    await page.waitForTimeout(2000);
    
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
    await page.waitForTimeout(3000);
  
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
    await page.waitForTimeout(2000); // Increased wait time for modal to fully load
    
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
          await page.waitForTimeout(500);
          await finalDeclineButton.click();
          console.log("✅ Final decline button clicked after scroll");
        }
      }
    } else {
      console.log("❌ Could not find final decline button");
    }
    
    console.log("✅ Decline with feedback process completed");
    
  } catch (error) {
    console.error("❌ Error in decline with feedback:", error.message);
    // Fallback to simple decline
    try {
      const declineButton = await memberCard.$('[aria-label*="Decline"]');
      if (declineButton) {
        await declineButton.click();
        console.log("✅ Fallback: Simple decline button clicked");
      }
    } catch (fallbackError) {
      console.error("❌ Fallback decline also failed:", fallbackError.message);
    }
  }
}

// Function to decline member based on configuration
async function declineMember(page, memberCard, declineReason) {
  if (config.DECLINE_WITH_FEEDBACK) {
    console.log("📝 Using decline with feedback (config: DECLINE_WITH_FEEDBACK = true)");
    await declineWithFeedback(page, memberCard, declineReason);
  } else {
    console.log("⚡ Using direct decline (config: DECLINE_WITH_FEEDBACK = false)");
    await declineDirectly(page, memberCard);
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
    
    // Filter out requests that are less than configured minimum age
    console.log(`\n⏰ Checking request ages (minimum: ${config.MIN_REQUEST_AGE_MINUTES} minutes)...`);
    const memberRequests = [];
    let skippedCount = 0;
    
    for (const memberCard of allMemberRequests) {
      const timeCheck = await checkRequestTime(memberCard);
      if (!timeCheck.shouldSkip) {
        memberRequests.push(memberCard);
      } else {
        skippedCount++;
        console.log(`⏩ Skipping request (too recent: ${timeCheck.requestAge} min)`);
      }
    }
    
    console.log(`✅ Eligible requests: ${memberRequests.length}/${allMemberRequests.length} (Skipped ${skippedCount} recent requests)`);
    
    // If all requests were skipped due to being too recent, treat as no members
    if (memberRequests.length === 0) {
      console.log(`⚠️ All member requests are too recent (< ${config.MIN_REQUEST_AGE_MINUTES} minutes old)`);
      addLogMessage(`All requests are too recent - waiting ${config.WAIT_TIME/1000} seconds`, className);
      await showToast(page, `All requests too recent (< ${config.MIN_REQUEST_AGE_MINUTES} min), waiting...`, 'info', className);
      return { noMembers: true };
    }
    
    // Update tracking with eligible count
    if (isMultiTabMode && className) {
      updateTabProcessingCount(className, 0, memberRequests.length);
    } else {
      totalMembers = memberRequests.length;
      currentProcessingCount = 0;
    }
    
    addLogMessage(`Processing ${memberRequests.length} eligible request(s)`, className);
    await showToast(page, `Processing ${memberRequests.length} eligible request(s)`, 'info', className);
    
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
                    await declineMember(page, memberRequests[i], dbResult.declineReason);
                  } else {
                    // Fallback to simple decline
                  await declineButton.click();
                    console.log("✅ Fallback: Simple decline button clicked");
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
                console.log("❌ Declining member due to database error");
                const dbErrorMessage = config.DECLINE_DATABASE_ERROR;
                addLogMessage(`❌ DB ERROR: ${memberName}`, className);
                await showToast(page, `❌ DB ERROR: ${memberName}`, 'error', className);
                
                // Update member data for database error
                memberData.approvalStatus = 'database_error';
                memberData.declineReason = dbErrorMessage;
                
                // Save member data to database
                await saveMemberProcessingData(page, memberData, className);
                
                // Log decline to JSON file
                const dbErrorClassName = isMultiTabMode && className ? className : config.SELECTED_CLASS;
                if (dbErrorClassName) {
                  logDeclineToJSON(dbErrorClassName, memberData);
                }
                
                await declineMember(page, memberRequests[i], dbErrorMessage);
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
              
              await declineMember(page, memberRequests[i], dbErrorMessage);
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
            await declineMember(page, memberRequests[i], dbErrorMessage);
            console.log("❌ Decline button clicked");
          }
          
          // Wait a bit between actions and before next member
          console.log(`⏳ Waiting ${config.WAIT_TIME/1000} seconds before processing next member...`);
          await page.waitForTimeout(config.WAIT_TIME);
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
        
        console.log(`💤 [${className}] Sleeping for ${config.WAIT_TIME/1000} seconds...`);
        addLogMessage(`Sleeping for ${config.WAIT_TIME/1000} seconds...`, className);
        
        // Sleep for configured time
        await page.waitForTimeout(config.WAIT_TIME);
        
        console.log(`⏰ [${className}] Sleep period ended, checking for new members...`);
        addLogMessage("Sleep period ended, checking for new members...", className);
        await showToast(page, "Checking for new members...", 'info', className);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      } else {
        // Members were processed, reset no-members counter
        noMembersCycleCount = 0;
        
        // Members were processed, wait a bit before next cycle
        console.log(`⏳ [${className}] Waiting ${config.WAIT_TIME/1000} seconds before next check...`);
        addLogMessage(`Waiting ${config.WAIT_TIME/1000} seconds before next check...`, className);
        await showToast(page, config.INFO_WAITING, 'info', className);
        await page.waitForTimeout(config.WAIT_TIME);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      }
      
    } catch (error) {
      console.error(`❌ [${className}] Error in automation loop:`, error.message);
      addLogMessage(`❌ Automation loop error: ${error.message}`, className);
      await showToast(page, `❌ Automation loop error`, 'error', className);
      
      // Wait configured time before retrying
      console.log(`⏳ [${className}] Waiting ${config.WAIT_TIME/1000} seconds before retrying...`);
      await page.waitForTimeout(config.WAIT_TIME);
    }
  }
}

// Multi-class automation function
async function startMultiClassAutomation(context, chromePath, userDataDir, profile) {
  console.log('\n🚀 Starting Multi-Class Automation');
  console.log('===================================');
  
  // Set multi-tab mode
  isMultiTabMode = true;
  
  // Get all configured classes
  const availableClasses = config.getAvailableClasses();
  const configuredClasses = availableClasses.filter(className => {
    const classConfig = config.CLASSES[className];
    return classConfig.GROUP_URL && classConfig.ELIGIBLE_PRODUCT_IDS.length > 0;
  });
  
  console.log(`📋 Processing ${configuredClasses.length} configured classes:`);
  configuredClasses.forEach(className => {
    console.log(`  - ${className}`);
  });
  
  // Create tabs and start automation for each class
  const automationPromises = [];
  
  for (const className of configuredClasses) {
    try {
      console.log(`\n🔗 Opening tab for: ${className}`);
      
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
      await page.waitForTimeout(3000);
      
      // Start automation loop for this class (don't await - run in parallel)
      const automationPromise = startClassAutomationLoop(page, className);
      automationPromises.push(automationPromise);
      
      // Small delay between opening tabs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error setting up automation for ${className}:`, error.message);
    }
  }
  
  console.log(`\n🎯 All ${configuredClasses.length} automation loops started!`);
  console.log('Each class is now processing members in parallel.');
  
  // Wait for all automation loops (they may exit due to auto-quit)
  try {
    await Promise.all(automationPromises);
  } catch (error) {
    console.log(`\n⚠️ Some automation loops ended: ${error.message}`);
  }
  
  // Check if all tabs have been closed due to auto-quit
  const remainingPages = context.pages();
  if (remainingPages.length === 0) {
    console.log('\n🚪 All tabs have been closed due to auto-quit. Exiting multi-class automation.');
    return;
  }
  
  // Check if only blank tabs remain
  const nonBlankPages = remainingPages.filter(page => {
    try {
      const url = page.url();
      return url && !url.includes('about:blank') && !url.includes('chrome://');
    } catch (error) {
      return false;
    }
  });
  
  if (nonBlankPages.length === 0 && remainingPages.length > 0) {
    console.log('\n🚪 Only blank tabs remain. Closing all remaining tabs and exiting.');
    // Close all remaining pages
    for (const page of remainingPages) {
      try {
        await page.close();
      } catch (error) {
        console.log(`⚠️ Error closing page: ${error.message}`);
      }
    }
    return;
  }
  
  console.log(`\n📊 ${remainingPages.length} tabs still active (${nonBlankPages.length} non-blank). Continuing monitoring...`);
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
        
        console.log(`💤 Sleeping for ${config.WAIT_TIME/1000} seconds...`);
        addLogMessage(`Sleeping for ${config.WAIT_TIME/1000} seconds...`);
        
        // Sleep for configured time
        await page.waitForTimeout(config.WAIT_TIME);
        
        console.log("⏰ Sleep period ended, checking for new members...");
        addLogMessage("Sleep period ended, checking for new members...");
        await showToast(page, "Checking for new members...", 'info');
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      } else {
        // Members were processed, reset no-members counter
        noMembersCycleCount = 0;
        
        // Members were processed, wait a bit before next cycle
        console.log(`⏳ Waiting ${config.WAIT_TIME/1000} seconds before next check...`);
        addLogMessage(`Waiting ${config.WAIT_TIME/1000} seconds before next check...`);
        await showToast(page, config.INFO_WAITING, 'info');
        await page.waitForTimeout(config.WAIT_TIME);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      }
      
    } catch (error) {
      console.error("❌ Error in automation loop:", error.message);
      addLogMessage(`❌ Automation loop error: ${error.message}`);
      await showToast(page, `❌ Automation loop error`, 'error');
      
      // Wait configured time before retrying
      console.log(`⏳ Waiting ${config.WAIT_TIME/1000} seconds before retrying...`);
      await page.waitForTimeout(config.WAIT_TIME);
    }
  }
}

(async () => {
  try {
    // First, prompt user to select a class
    console.log("🚀 Starting Facebook Automation System");
    console.log("======================================");
    
    const selectedClass = await promptClassSelection();
    if (!selectedClass) {
      console.log("\n❌ No class selected or class not configured. Exiting...");
      process.exit(1);
    }
    
    // Handle multi-class selection
    if (selectedClass === 'ALL_CLASSES') {
      console.log(`\n🎯 Starting automation for: ALL CLASSES (Multi-tab mode)`);
      console.log("======================================\n");
    } else {
      console.log(`\n🎯 Starting automation for: ${selectedClass}`);
      console.log(`📍 Group URL: ${config.GROUP_URL}`);
      console.log(`🆔 Eligible Product IDs: ${config.ELIGIBLE_PRODUCT_IDS.length} items`);
      console.log("======================================\n");
    }

    // Path to your Chrome executable (adjust if needed)
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // Windows
    // macOS example:
    // const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    // Path to the user data directory where Chrome stores profiles
    // Replace with your actual path
    const userDataDir = "C:\\Users\\abusa\\AppData\\Local\\Google\\Chrome\\User Data"; // Windows
    // macOS example:
    // const userDataDir = "/Users/aweshislam/Library/Application Support/Google/Chrome";

    // The profile you want to use (e.g., "Default", "Profile 1", "Profile 2")
    let profile = "afs"; // Changed to Default to avoid profile conflicts

    console.log("Starting Facebook automation...");
    console.log("Chrome path:", chromePath);
    console.log("User data directory:", userDataDir);
    console.log("Profile:", profile);

    // Check if Chrome executable exists
    if (!fs.existsSync(chromePath)) {
      throw new Error(`Chrome executable not found at: ${chromePath}`);
    }

    // Check if user data directory exists
    if (!fs.existsSync(userDataDir)) {
      throw new Error(`User data directory not found at: ${userDataDir}`);
    }

    // Check if profile directory exists
    const profilePath = `${userDataDir}/${profile}`;
    if (!fs.existsSync(profilePath)) {
      console.warn(`Profile directory not found: ${profilePath}`);
      console.log("Available profiles:");
      const profiles = fs.readdirSync(userDataDir).filter(item => 
        fs.statSync(`${userDataDir}/${item}`).isDirectory() && 
        (item.startsWith('Profile') || item === 'Default')
      );
      profiles.forEach(p => console.log(`  - ${p}`));
      
      // Try with Default profile as fallback
      console.log("Trying with Default profile instead...");
      const fallbackProfile = "Default";
      const fallbackProfilePath = `${userDataDir}/${fallbackProfile}`;
      if (fs.existsSync(fallbackProfilePath)) {
        console.log(`Using fallback profile: ${fallbackProfile}`);
        profile = fallbackProfile; // Update the profile variable
      } else {
        throw new Error("No valid profile found. Please check your Chrome profile setup.");
      }
    }

    console.log("Launching Chrome...");
    console.log("Using profile:", profile);

    // Launch Chrome with Playwright using the specific profile
    console.log("Profile path:", profilePath);
    console.log("Profile exists:", fs.existsSync(profilePath));
    
    const context = await chromium.launchPersistentContext(profilePath, {
      headless: false, // so you can see the browser
      executablePath: chromePath,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ],
      timeout: 30000, // 30 second timeout
    });

    console.log("Chrome launched successfully!");

    // Handle multi-class vs single class automation
    if (selectedClass === 'ALL_CLASSES') {
      // Start multi-class automation
      await startMultiClassAutomation(context, chromePath, userDataDir, profile);
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
        await page.waitForTimeout(3000);
        
        // Check if we're actually on Facebook
        const currentUrl = page.url();
        console.log("Current URL:", currentUrl);
        
        if (currentUrl.includes('facebook.com')) {
          console.log("✅ Successfully navigated to Facebook!");
          
          // Wait for the page to fully load
          await page.waitForTimeout(5000);
          
          // Start the main automation loop
          await startAutomationLoop(page);
          
          // Cleanup after automation loop ends (due to auto-quit)
          console.log('\n🚪 Automation loop ended. Cleaning up remaining tabs...');
          const remainingPages = context.pages();
          
          // Close all remaining pages (including blank tabs)
          for (const remainingPage of remainingPages) {
            try {
              await remainingPage.close();
              console.log('✅ Closed remaining tab');
            } catch (error) {
              console.log(`⚠️ Error closing remaining tab: ${error.message}`);
            }
          }
          
          console.log('✅ All tabs closed. Exiting single class automation.');
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
            await page.waitForTimeout(5000);
            
            // Start the main automation loop
            await startAutomationLoop(page);
            
            // Cleanup after automation loop ends (due to auto-quit)
            console.log('\n🚪 Automation loop ended. Cleaning up remaining tabs...');
            const remainingPages = context.pages();
            
            // Close all remaining pages (including blank tabs)
            for (const remainingPage of remainingPages) {
              try {
                await remainingPage.close();
                console.log('✅ Closed remaining tab');
              } catch (error) {
                console.log(`⚠️ Error closing remaining tab: ${error.message}`);
              }
            }
            
            console.log('✅ All tabs closed. Exiting single class automation.');
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
