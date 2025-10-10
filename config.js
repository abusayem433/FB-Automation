// Facebook Automation Configuration
// Edit the values below to customize the automation behavior

const config = {
  // ===========================================
  // CLASS CONFIGURATIONS
  // ===========================================
  CLASSES: {
    "Class 6": {
      GROUP_URL: "https://www.facebook.com/groups/1473078223944296/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
      ELIGIBLE_PRODUCT_IDS: [
        "4f45bf11-f21d-444a-b6d0-ca21b571787b", // Class 6 Diamond
        "094132e7-6ae6-433c-a824-e77cd1da9395", // Class 6 Gold July
        "dd2fc129-e625-4c3c-be8f-245a1b48ea76"  // Class 6 (General)
      ]
    },
    "Class 7": {
      GROUP_URL: "https://www.facebook.com/groups/1490409665507110/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
      ELIGIBLE_PRODUCT_IDS: [
        "1bef8410-8e64-4074-90cb-0460f3e9e40d", // Class 7 Diamond
        "699646e8-8139-447e-84f9-8601fab2b0d4", // Class 7 Gold
        "87a81016-10a8-4814-9234-77146db0ecae"  // Class 7 (General)
      ]
    },
    "Class 8": {
      GROUP_URL: "https://www.facebook.com/groups/1234825928691234/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
      ELIGIBLE_PRODUCT_IDS: [
        "03f92ff3-aa7c-43fb-b860-7c97046d6006", // Class 8 Diamond
        "7d8f10c3-22fa-49dd-a387-0f7f05418768", // Class 8 Gold July
        "3ff37b15-50b1-4b68-b6c2-7ffe3ba03e48"  // Class 8 (General)
      ]
    },
    "Class 9": {
      GROUP_URL: "https://www.facebook.com/groups/1895113984369381/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
      ELIGIBLE_PRODUCT_IDS: [
        "19e7c5ff-d9c1-43f1-8e0e-98d4eaf1d26e", // Class 9 Diamond
        "b6e8dd78-252b-4f84-912e-6f971afaea4b", // Class 9 Gold July
        "e225c7d2-3d32-4c15-8952-6326ea90e38e"  // Class 9 (General)
      ]
    },
    "Class 10 Science": {
      GROUP_URL: "https://www.facebook.com/groups/2499286187104014/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
      ELIGIBLE_PRODUCT_IDS: [
        "f9db6ff1-c365-4e29-a3a7-7d0bd9487c9c",
        "4e8f4314-2d70-48a6-8fb0-4384d735dce2",
        "d8787524-8ef5-4a22-a605-8d9a5a75eee4"
      ]
    },
    "Class 10 Commerce": {
      GROUP_URL: "",
      ELIGIBLE_PRODUCT_IDS: []
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
