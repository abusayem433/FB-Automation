require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const config = require('./config.js');
const path = require('path');

// Database configuration from environment variables
const dbConfig = {
  user: process.env.DB_USER || 'root',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'db_name',
  password: process.env.DB_PASSWORD || 'db_pass',
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS
  }
};

// Create connection pool
const pool = new Pool(dbConfig);

// Function to log decline reasons
function logDeclineReason(phone, transactionId, declineReason, facebookUserId = '') {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      phone: phone,
      transactionId: transactionId,
      facebookUserId: facebookUserId,
      declineReason: declineReason
    };
    
    const logFile = path.join(__dirname, 'decline_reasons.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine, 'utf8');
    console.log(`📝 Decline reason logged to file`);
  } catch (error) {
    console.error('Error logging decline reason:', error.message);
  }
}

// Function to check and process payment approval
async function processPaymentApproval(phone = '', transactionId = '', approvedId = '') {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Checking payment for phone: ${phone}, transaction: ${transactionId}, approved_id: ${approvedId}`);
    
    // First, check if transaction ID exists (regardless of approval status)
    const transactionCheckQuery = `
      SELECT pp.*, u.phone, u.id as user_id 
      FROM product_payment pp 
      JOIN "User" u ON pp.user_id = u.id
      WHERE (pp.transaction_id = $1 OR pp.id::text = $1)
    `;
    
    const transactionResult = await client.query(transactionCheckQuery, [transactionId]);
    
    if (transactionResult.rows.length > 0) {
      // Transaction ID exists, check product eligibility first
      const existingRecord = transactionResult.rows[0];
      const productId = existingRecord.product_id;
      
      // Check if product_id is in the eligible products list
      if (!config.ELIGIBLE_PRODUCT_IDS.includes(productId)) {
        console.log(`❌ Product ID ${productId} is not eligible - DECLINING`);
        
        const declineReason = config.DECLINE_PRODUCT_NOT_ELIGIBLE;
        
        // Log the decline reason
        logDeclineReason(phone, transactionId, declineReason, approvedId);
        
        return { 
          status: 'declined', 
          rowCount: 0, 
          declineReason: declineReason
        };
      }
      
      // Product is eligible, check if it's already approved
      const isAlreadyApproved = existingRecord.is_approved;
      
              if (isAlreadyApproved) {
                // Transaction ID is already approved
                console.log(`❌ Transaction ID already approved - DECLINING`);
                
                const declineReason = config.DECLINE_ALREADY_APPROVED;
        
        // Log the decline reason
        logDeclineReason(phone, transactionId, declineReason, approvedId);
        
        return { 
          status: 'declined', 
          rowCount: 0, 
          declineReason: declineReason
        };
      }
      
      // Transaction ID exists but not approved yet - APPROVE
      console.log(`✅ Row found - APPROVING payment for user ID: ${existingRecord.user_id}`);
      
      // Update is_approved to true and set approved_id
      const updateQuery = `
        UPDATE product_payment 
        SET is_approved = true, approved_id = $3, updated_at = NOW()
        WHERE user_id = $1 AND transaction_id = $2
      `;
      
      const updateResult = await client.query(updateQuery, [
        existingRecord.user_id, 
        transactionId,
        approvedId
      ]);
      
      console.log(`✅ Payment approved and updated with approved_id: ${approvedId}. Rows affected: ${updateResult.rowCount}`);
      
      // Add delay after approval to prevent overwhelming the database
      console.log('⏳ Waiting 2 seconds before next operation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { status: 'approved', rowCount: updateResult.rowCount, approvedId: approvedId };
            } else {
              // Transaction ID doesn't exist
              console.log(`❌ Transaction ID not found - DECLINING payment`);
              
              const declineReason = config.DECLINE_TRANSACTION_NOT_FOUND;
      
      // Log the decline reason
      logDeclineReason(phone, transactionId, declineReason, approvedId);
      
      return { 
        status: 'declined', 
        rowCount: 0, 
        declineReason: declineReason
      };
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Function to get all pending payments (for testing/debugging)
async function getPendingPayments() {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT pp.*, u.phone, u.id as user_id 
      FROM product_payment pp 
      JOIN "User" u ON pp.user_id = u.id
      WHERE pp.is_approved = false
      LIMIT 10
    `;
    
    const result = await client.query(query);
    console.log(`📊 Found ${result.rows.length} pending payments:`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. User ID: ${row.user_id}, Phone: ${row.phone}, Transaction: ${row.transaction_id}`);
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error fetching pending payments:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting database automation...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Example usage - replace with actual phone and transaction_id
    const phone = ''; // Replace with actual phone number
    const transactionId = ''; // Replace with actual transaction ID
    
    if (phone && transactionId) {
      const result = await processPaymentApproval(phone, transactionId);
      console.log('Final result:', result);
    } else {
      console.log('⚠️ No phone or transaction ID provided. Showing pending payments instead...');
      await getPendingPayments();
    }
    
  } catch (error) {
    console.error('❌ Main execution error:', error.message);
  } finally {
    // Close the pool
    await pool.end();
    console.log('🔒 Database connection pool closed');
  }
}

// Function to save member processing logs
async function saveMemberLog(memberData) {
  const client = await pool.connect();
  
  try {
    const {
      memberName,
      memberUserId,
      memberQA,
      memberPhone,
      memberTrxId,
      approvalStatus,
      declineReason,
      facebookUserId
    } = memberData;
    
    console.log(`📝 Saving member log for: ${memberName}`);
    
    const insertQuery = `
      INSERT INTO member_processing_logs (
        member_name,
        member_user_id,
        member_qa,
        member_phone,
        member_trx_id,
        approval_status,
        decline_reason,
        facebook_user_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    
    const values = [
      memberName || 'Unknown',
      memberUserId || null,
      JSON.stringify(memberQA || {}),
      memberPhone || null,
      memberTrxId || null,
      approvalStatus || 'unknown',
      declineReason || null,
      facebookUserId || null
    ];
    
    const result = await client.query(insertQuery, values);
    
    console.log(`✅ Member log saved successfully`);
    return { success: true, rowCount: result.rowCount };
    
  } catch (error) {
    console.error('❌ Error saving member log:', error.message);
    throw error;
  } finally {
    client.release();
  }
}


// Function to get member processing logs
async function getMemberLogs(limit = 50) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        id,
        member_name,
        member_user_id,
        member_qa,
        member_phone,
        member_trx_id,
        approval_status,
        decline_reason,
        facebook_user_id,
        created_at
      FROM member_processing_logs 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    
    console.log(`📊 Retrieved ${result.rows.length} member logs`);
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error fetching member logs:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Export functions for use in other modules
module.exports = {
  processPaymentApproval,
  getPendingPayments,
  testConnection,
  saveMemberLog,
  getMemberLogs,
  pool
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
