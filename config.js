// Facebook Automation Configuration
// Edit the values below to customize the automation behavior

const config = {
  // ===========================================
  // GROUP SETTINGS
  // ===========================================
  GROUP_URL: "https://www.facebook.com/groups/2499286187104014/member-requests",

  // ===========================================
  // ELIGIBLE PRODUCT IDS
  // ===========================================
  ELIGIBLE_PRODUCT_IDS: [
    "f9db6ff1-c365-4e29-a3a7-7d0bd9487c9c",
    "4e8f4314-2d70-48a6-8fb0-4384d735dce2",
    "d8787524-8ef5-4a22-a605-8d9a5a75eee4"
  ],

  // ===========================================
  // DECLINE MESSAGES (in Bangla)
  // ===========================================
  DECLINE_ALREADY_APPROVED: "এই ট্রানজেকশন আইডি ব্যবহৃত হয়েছে",
  DECLINE_PHONE_MISMATCH:
    "ফোন নম্বরটি এই ট্রানজেকশন আইডির জন্য সঠিক নয়, যে নম্বর দিয়ে আইডি খুলে কোর্স কিনেছেন সেই নম্বর দিন",
  DECLINE_TRANSACTION_NOT_FOUND: "ট্রানজেকশন আইডি সঠিক নয়",
  DECLINE_PRODUCT_NOT_ELIGIBLE: "এই গ্রুপের জন্য আপনি যোগ্য নন",
  DECLINE_NO_ANSWERS: "প্রশ্নের উত্তর দেওয়া হয়নি",
  DECLINE_MISSING_PHONE: "ফোন নম্বর দেওয়া হয়নি",
  DECLINE_MISSING_TRANSACTION: "ট্রানজেকশন আইডি দেওয়া হয়নি",
  DECLINE_MISSING_BOTH: "ট্রানজেকশন আইডি ও ফোন নম্বর দেওয়া হয়নি",
  DECLINE_DATABASE_ERROR:
    "টেকনিক্যাল ত্রুটির কারণে আপনার অ্যাপ্রুভালটি ডিক্লাইন হয়েছে, যদি মনে হয় সব ঠিক আছে তাহলে পুনরায় রিকোয়েস্ট দিন",

  // ===========================================
  // SUCCESS MESSAGES
  // ===========================================
  SUCCESS_APPROVED: "সদস্য সফলভাবে অনুমোদিত",
  SUCCESS_COMPLETED: "প্রক্রিয়াকরণ সম্পন্ন",

  // ===========================================
  // INFO MESSAGES
  // ===========================================
  INFO_LOOKING: "সদস্য অনুরোধ খুঁজছি...",
  INFO_NO_MEMBERS: "কোন সদস্য অনুরোধ পাওয়া যায়নি",
  INFO_WAITING: "পরবর্তী চেকের জন্য অপেক্ষা করছি...",

  // ===========================================
  // TIMING SETTINGS (in milliseconds)
  // ===========================================
  WAIT_NO_MEMBERS: 600000, // 10 minutes
  WAIT_BETWEEN_MEMBERS: 30000, // 30 seconds
  WAIT_ON_ERROR: 120000, // 2 minutes
  WAIT_BETWEEN_ACTIONS: 3000, // 3 seconds
};

console.log('✅ Configuration loaded successfully');

module.exports = config;
