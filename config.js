// Facebook Automation Configuration
// Edit the values below to customize the automation behavior

const config = {
  // ===========================================
  // CLASS CONFIGURATIONS
  // ===========================================
  CLASSES: {
    "Class 6": {
      GROUP_URL: "", // To be provided by user
      ELIGIBLE_PRODUCT_IDS: [] // To be provided by user
    },
    "Class 7": {
      GROUP_URL: "", // To be provided by user
      ELIGIBLE_PRODUCT_IDS: [] // To be provided by user
    },
    "Class 8": {
      GROUP_URL: "", // To be provided by user
      ELIGIBLE_PRODUCT_IDS: [] // To be provided by user
    },
    "Class 9": {
      GROUP_URL: "", // To be provided by user
      ELIGIBLE_PRODUCT_IDS: [] // To be provided by user
    },
    "Class 10 Science": {
      GROUP_URL: "https://www.facebook.com/groups/2499286187104014/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false", // To be provided by user
      ELIGIBLE_PRODUCT_IDS: [
        "f9db6ff1-c365-4e29-a3a7-7d0bd9487c9c",
        "4e8f4314-2d70-48a6-8fb0-4384d735dce2",
        "d8787524-8ef5-4a22-a605-8d9a5a75eee4"] // To be provided by user
    },
    "Class 10 Commerce": {
      GROUP_URL: "", // To be provided by user
      ELIGIBLE_PRODUCT_IDS: [] // To be provided by user
    }
  },

  // ===========================================
  // CURRENT SELECTED CLASS (will be set at runtime)
  // ===========================================
  SELECTED_CLASS: null,
  GROUP_URL: "", // Will be set based on selected class
  ELIGIBLE_PRODUCT_IDS: [], // Will be set based on selected class

  // ===========================================
  // DECLINE SETTINGS
  // ===========================================
  DECLINE_WITH_FEEDBACK: false, // Set to false for direct decline without feedback

  // ===========================================
  // DECLINE MESSAGES (in Bangla)
  // ===========================================
  DECLINE_ALREADY_APPROVED: "এই ট্রানজেকশন আইডি একবার ব্যবহৃত হয়েছে, একটি ট্রানজেকশন আইডি ব্যবহার করে একবারই গ্রুপে জয়েন হতে পারবে",
  DECLINE_PHONE_MISMATCH:
    "ফোন নম্বরটি এই ট্রানজেকশন আইডির জন্য সঠিক নয়, যে নম্বর দিয়ে আইডি খুলে কোর্স কিনেছ সেই নম্বরটি দাও",
  DECLINE_TRANSACTION_NOT_FOUND: "ট্রানজেকশন আইডি সঠিক নয়",
  DECLINE_PRODUCT_NOT_ELIGIBLE: "তুমি যে কোর্স কিনেছো, সেই কোর্সটি এই গ্রুপের জন্যে নয়",
  DECLINE_NO_ANSWERS: "প্রশ্নের উত্তর দেওয়া হয়নি",
  DECLINE_MISSING_PHONE: "ফোন নম্বর দেওয়া হয়নি",
  DECLINE_MISSING_TRANSACTION: "ট্রানজেকশন আইডি দেওয়া হয়নি",
  DECLINE_MISSING_BOTH: "ট্রানজেকশন আইডি ও ফোন নম্বর দেওয়া হয়নি",
  DECLINE_DATABASE_ERROR:
    "সঠিক তথ্য প্রদান করে আবার রিকোয়েস্ট দাও",

  // ===========================================
  // SUCCESS MESSAGES
  // ===========================================
  SUCCESS_APPROVED: "সফলভাবে এপ্রুভ করা হয়েছে",
  SUCCESS_COMPLETED: "প্রক্রিয়াকরণ সম্পন্ন হয়েছে",

  // ===========================================
  // INFO MESSAGES
  // ===========================================
  INFO_LOOKING: "সদস্য অনুরোধ খুঁজছি...",
  INFO_NO_MEMBERS: "কোন সদস্য অনুরোধ পাওয়া যায়নি",
  INFO_WAITING: "পরবর্তী চেকের জন্য অপেক্ষা করছি...",

  // ===========================================
  // TIMING SETTINGS (in milliseconds)
  // ===========================================
  WAIT_NO_MEMBERS: 3000, // 3 seconds
  WAIT_BETWEEN_MEMBERS: 3000, // 3 second
  WAIT_ON_ERROR: 3000, // 3 seconds
  WAIT_BETWEEN_ACTIONS: 3000, // 3 seconds

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  setSelectedClass: function(className) {
    if (this.CLASSES[className]) {
      this.SELECTED_CLASS = className;
      this.GROUP_URL = this.CLASSES[className].GROUP_URL;
      this.ELIGIBLE_PRODUCT_IDS = this.CLASSES[className].ELIGIBLE_PRODUCT_IDS;
      console.log(`✅ Selected class: ${className}`);
      console.log(`📍 Group URL: ${this.GROUP_URL}`);
      console.log(`🆔 Eligible Product IDs: ${this.ELIGIBLE_PRODUCT_IDS.length} items`);
      return true;
    } else {
      console.error(`❌ Class "${className}" not found in configuration`);
      return false;
    }
  },

  getAvailableClasses: function() {
    return Object.keys(this.CLASSES);
  },

  updateClassConfig: function(className, groupUrl, eligibleIds) {
    if (this.CLASSES[className]) {
      this.CLASSES[className].GROUP_URL = groupUrl;
      this.CLASSES[className].ELIGIBLE_PRODUCT_IDS = eligibleIds;
      console.log(`✅ Updated configuration for ${className}`);
      return true;
    } else {
      console.error(`❌ Class "${className}" not found`);
      return false;
    }
  }
};

console.log('✅ Configuration loaded successfully');

module.exports = config;
