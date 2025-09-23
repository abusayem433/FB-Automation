// filename: facebook-profile.js
const { chromium } = require("playwright");
const fs = require("fs");
const { processPaymentApproval, saveMemberLog } = require("./db_automation.js");
const config = require("./config.js");

// Toast notification system
let currentProcessingCount = 0;
let totalMembers = 0;
let logMessages = [];

// Function to create and show toast notification
async function showToast(page, message, type = 'info') {
  try {
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
    await page.evaluate(({ msg, msgType, progress, total, logs }) => {
      const toast = document.getElementById('fb-automation-toast');
      if (toast) {
        const timestamp = new Date().toLocaleTimeString();
        const progressText = total > 0 ? `Processing ${progress}/${total}` : 'Processing...';
        
        toast.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">
            🤖 FB Automation - ${progressText}
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
      progress: currentProcessingCount, 
      total: totalMembers, 
      logs: logMessages 
    });

  } catch (error) {
    console.error('Error showing toast:', error.message);
  }
}

// Function to add log message
function addLogMessage(message) {
  const timestamp = new Date().toLocaleTimeString();
  logMessages.push(`[${timestamp}] ${message}`);
  // Keep only last 20 messages
  if (logMessages.length > 20) {
    logMessages = logMessages.slice(-20);
  }
}

// Function to save member processing data to database
async function saveMemberProcessingData(page, memberData) {
  try {
    await saveMemberLog(memberData);
    addLogMessage(`📝 Saved member log: ${memberData.memberName}`);
    await showToast(page, `📝 Saved log for ${memberData.memberName}`, 'info');
  } catch (error) {
    console.error('❌ Error saving member log:', error.message);
    addLogMessage(`❌ Failed to save log: ${error.message}`);
    await showToast(page, `❌ Failed to save log`, 'error');
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

// Function to scrape member requests and handle approval/decline
async function scrapeMemberRequests(page) {
  try {
    console.log("🔍 Looking for member requests...");
    addLogMessage(config.INFO_LOOKING);
    await showToast(page, config.INFO_LOOKING, 'info');
    
    // Wait for member request elements to load - look for the actual member request cards
    await page.waitForSelector('[aria-label*="Approve"]', { timeout: 10000 });
    
    // Find all member request items by looking for approve buttons
    const approveButtons = await page.$$('[aria-label*="Approve"]');
    console.log(`Found ${approveButtons.length} member request(s)`);
    
    // Set total members for progress tracking
    totalMembers = approveButtons.length;
    currentProcessingCount = 0;
    
    if (totalMembers === 0) {
      console.log("❌ No member requests found");
      addLogMessage(`${config.INFO_NO_MEMBERS} - will retry in 10 minutes`);
      await showToast(page, config.INFO_NO_MEMBERS, 'info');
      return { noMembers: true };
    }
    
    addLogMessage(`Found ${totalMembers} member request(s)`);
    await showToast(page, `Found ${totalMembers} member request(s)`, 'info');
    
    // Get the parent containers of the approve buttons (these are the member request cards)
    const memberRequests = [];
    for (const button of approveButtons) {
      const memberCard = await button.evaluateHandle(el => {
        // Find the parent container that contains the member info
        let parent = el.closest('[role="listitem"]') || el.closest('div[class*="x1jx94hy"]');
        return parent;
      });
      if (memberCard) {
        memberRequests.push(memberCard);
      }
    }
    
    for (let i = 0; i < memberRequests.length; i++) {
      currentProcessingCount = i + 1;
      console.log(`\n--- Processing Member Request ${currentProcessingCount}/${totalMembers} ---`);
      addLogMessage(`Processing member ${currentProcessingCount}/${totalMembers}`);
      await showToast(page, `Processing member ${currentProcessingCount}/${totalMembers}`, 'info');
      
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
        addLogMessage(`Processing: ${memberName}`);
        
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
                // Check database for payment approval and pass Facebook user ID
                const dbResult = await processPaymentApproval(phoneNumber, transactionId, facebookUserId);
                
                if (dbResult.status === 'approved') {
                  console.log("✅ Payment verified in database - APPROVING member");
                  console.log(`✅ Approved ID stored: ${dbResult.approvedId}`);
                  addLogMessage(`✅ APPROVED: ${memberName}`);
                  await showToast(page, `✅ APPROVED: ${memberName}`, 'success');
                  
                  // Update member data for approved status
                  memberData.approvalStatus = 'approved';
                  memberData.memberUserId = dbResult.approvedId;
                  
                  // Save member data to database
                  await saveMemberProcessingData(page, memberData);
                  
                  await approveButton.click();
                  console.log("✅ Member approved and payment confirmed");
                } else {
                  console.log("❌ Payment not found or not approved in database - DECLINING member");
                  if (dbResult.declineReason) {
                    console.log(`📝 Decline reason: ${dbResult.declineReason}`);
                    addLogMessage(`❌ DECLINED: ${memberName} - ${dbResult.declineReason}`);
                    await showToast(page, `❌ DECLINED: ${memberName}`, 'error');
                    
                    // Update member data for declined status
                    memberData.approvalStatus = 'declined';
                    memberData.declineReason = dbResult.declineReason;
                    
                    // Save member data to database
                    await saveMemberProcessingData(page, memberData);
                    
                    // Use enhanced decline with feedback
                    await declineWithFeedback(page, memberRequests[i], dbResult.declineReason);
                  } else {
                    // Fallback to simple decline
                  await declineButton.click();
                    console.log("✅ Fallback: Simple decline button clicked");
                    addLogMessage(`❌ DECLINE FAILED: ${memberName}`);
                    await showToast(page, `❌ DECLINE FAILED: ${memberName}`, 'error');
                    
                    // Update member data for decline failure
                    memberData.approvalStatus = 'decline_failed';
                    memberData.declineReason = 'Decline button click failed';
                    
                    // Save member data to database
                    await saveMemberProcessingData(page, memberData);
                    
                  console.log("❌ Member declined due to payment verification failure");
                  }
                }
              } catch (dbError) {
                console.error("❌ Database error during payment check:", dbError.message);
                console.log("❌ Declining member due to database error");
                const dbErrorMessage = config.DECLINE_DATABASE_ERROR;
                addLogMessage(`❌ DB ERROR: ${memberName}`);
                await showToast(page, `❌ DB ERROR: ${memberName}`, 'error');
                
                // Update member data for database error
                memberData.approvalStatus = 'database_error';
                memberData.declineReason = dbErrorMessage;
                
                // Save member data to database
                await saveMemberProcessingData(page, memberData);
                
                await declineWithFeedback(page, memberRequests[i], dbErrorMessage);
              }
            } else {
              console.log("❌ Missing transaction ID or phone number - DECLINING");
              let dbErrorMessage
              if(!phoneNumber){
                dbErrorMessage = config.DECLINE_MISSING_PHONE
              }else if(!transactionId){
                dbErrorMessage = config.DECLINE_MISSING_TRANSACTION
              }else{
                dbErrorMessage = config.DECLINE_MISSING_BOTH;
              }
              addLogMessage(`❌ MISSING INFO: ${memberName} - ${dbErrorMessage}`);
              await showToast(page, `❌ MISSING INFO: ${memberName}`, 'error');
              
              // Update member data with available info and missing info status
              memberData.memberQA = answers;
              memberData.memberPhone = phoneNumber;
              memberData.memberTrxId = transactionId;
              memberData.approvalStatus = 'missing_info';
              memberData.declineReason = dbErrorMessage;
              
              // Save member data to database
              await saveMemberProcessingData(page, memberData);
              
              await declineWithFeedback(page,memberRequests[i],dbErrorMessage);
              console.log("❌ Decline button clicked");
            }
          } else {
            console.log("❌ Member has no answers - DECLINING");
            addLogMessage(`❌ NO ANSWERS: ${memberName}`);
            await showToast(page, `❌ NO ANSWERS: ${memberName}`, 'error');
            
            // Update member data for no answers status
            memberData.approvalStatus = 'no_answers';
            memberData.declineReason = config.DECLINE_NO_ANSWERS;
            
            // Save member data to database
            await saveMemberProcessingData(page, memberData);
            const dbErrorMessage = memberData.declineReason;
            await declineWithFeedback(page,memberRequests[i],dbErrorMessage)
            console.log("❌ Decline button clicked");
          }
          
          // Wait a bit between actions and before next member
          console.log(`⏳ Waiting ${config.WAIT_BETWEEN_ACTIONS/1000} seconds before processing next member...`);
          await page.waitForTimeout(config.WAIT_BETWEEN_ACTIONS);
        } else {
          console.log("⚠️ Could not find approve/decline buttons for this member");
          addLogMessage(`⚠️ NO BUTTONS: ${memberName}`);
          await showToast(page, `⚠️ NO BUTTONS: ${memberName}`, 'error');
        }
        
      } catch (memberError) {
        console.error(`❌ Error processing member request ${i + 1}:`, memberError.message);
        addLogMessage(`❌ PROCESSING ERROR: ${memberError.message}`);
        await showToast(page, `❌ PROCESSING ERROR`, 'error');
      }
    }
    
    // All members processed
    addLogMessage(`✅ ${config.SUCCESS_COMPLETED} ${totalMembers} members`);
    await showToast(page, `✅ ${config.SUCCESS_COMPLETED} ${totalMembers} members`, 'success');
    
  } catch (error) {
    console.error("❌ Error scraping member requests:", error.message);
  }
}

// Main automation loop with sleep/retry cycle
async function startAutomationLoop(page) {
  let cycleCount = 0;
  
  
  while (true) {
    try {
      cycleCount++;
      console.log(`\n🔄 Starting automation cycle ${cycleCount}`);
      addLogMessage(`Starting automation cycle ${cycleCount}`);
      await showToast(page, `Starting automation cycle ${cycleCount}`, 'info');
      
      // Scrape member request information
      const result = await scrapeMemberRequests(page);
      
      if (result && result.noMembers) {
        console.log(`💤 No members found, sleeping for ${config.WAIT_NO_MEMBERS/60000} minutes...`);
        addLogMessage(`No members found, sleeping for ${config.WAIT_NO_MEMBERS/60000} minutes...`);
        await showToast(page, "No members found, sleeping...", 'info');
        
        // Sleep for configured time
        await page.waitForTimeout(config.WAIT_NO_MEMBERS);
        
        console.log("⏰ Sleep period ended, checking for new members...");
        addLogMessage("Sleep period ended, checking for new members...");
        await showToast(page, "Checking for new members...", 'info');
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      } else {
        // Members were processed, wait a bit before next cycle
        console.log(`⏳ Waiting ${config.WAIT_BETWEEN_MEMBERS/1000} seconds before next check...`);
        addLogMessage(`Waiting ${config.WAIT_BETWEEN_MEMBERS/1000} seconds before next check...`);
        await showToast(page, config.INFO_WAITING, 'info');
        await page.waitForTimeout(config.WAIT_BETWEEN_MEMBERS);
        
        // Refresh the page to check for new members
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      }
      
    } catch (error) {
      console.error("❌ Error in automation loop:", error.message);
      addLogMessage(`❌ Automation loop error: ${error.message}`);
      await showToast(page, `❌ Automation loop error`, 'error');
      
      // Wait configured time before retrying
      console.log(`⏳ Waiting ${config.WAIT_ON_ERROR/60000} minutes before retrying...`);
      await page.waitForTimeout(config.WAIT_ON_ERROR);
    }
  }
}

(async () => {
  try {
    // Path to your Chrome executable (adjust if needed)
    const chromePath =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; // macOS
    // Windows example:
    // const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    // Path to the user data directory where Chrome stores profiles
    // Replace with your actual path
    const userDataDir =
      "/Users/aweshislam/Library/Application Support/Google/Chrome"; // macOS
    // Windows example:
    // const userDataDir = "C:\\Users\\your-username\\AppData\\Local\\Google\\Chrome\\User Data";

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
        }
      } catch (titleError) {
        console.log("Could not get page title:", titleError.message);
        throw navigationError;
      }
    }
    
  } catch (error) {
    console.error("Error occurred:", error.message);
    console.error("Full error:", error);
  }
})();
