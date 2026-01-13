// Facebook Automation Configuration
// Edit the values below to customize the automation behavior

const config = {
  // ===========================================
  // GROUP URL EXTENSION (AUTO-APPENDED)
  // ===========================================
  // You can now set each class GROUP_URL to the "main group url" only (base),
  // and the system will append this extension automatically.
  //
  // Example base you provide:
  //   https://www.facebook.com/groups/1234567890
  //
  // System will use:
  //   https://www.facebook.com/groups/1234567890/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false
  GROUP_URL_EXTENSION:
    "/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",

  // Build the full member-requests URL from a base group URL.
  // If the provided URL already contains "/member-requests", it is returned as-is.
  buildGroupUrl: function (baseOrFullUrl) {
    if (!baseOrFullUrl) return "";
    const url = String(baseOrFullUrl).trim();
    if (!url) return "";

    // If user already provided the full member-requests URL, don't append again.
    if (url.includes("/member-requests")) return url;

    // Normalize trailing slash before appending extension (extension starts with "/").
    const normalizedBase = url.endsWith("/") ? url.slice(0, -1) : url;
    return `${normalizedBase}${this.GROUP_URL_EXTENSION}`;
  },

  // ===========================================
  // CLASS CONFIGURATIONS
  // ===========================================
  CLASSES: {
    "Class 6": {
      YEAR: 2025,
      GROUP_URL: "https://www.facebook.com/groups/1473078223944296",
      ELIGIBLE_PRODUCT_IDS: [
        "4f45bf11-f21d-444a-b6d0-ca21b571787b", // Class 6 Diamond
        "d8787524-8ef5-4a22-a605-8d9a5a75eee4", // Class 6 Gold July
        "dd2fc129-e625-4c3c-be8f-245a1b48ea76"  // Class 6 (General)
      ]
    },
    "Class 7": {
      YEAR: 2025,
      GROUP_URL: "https://www.facebook.com/groups/1490409665507110",
      ELIGIBLE_PRODUCT_IDS: [
        "1bef8410-8e64-4074-90cb-0460f3e9e40d", // Class 7 Diamond
        "699646e8-8139-447e-84f9-8601fab2b0d4", // Class 7 Gold
        "87a81016-10a8-4814-9234-77146db0ecae"  // Class 7 (General)
      ]
    },
    "Class 8": {
      YEAR: 2025,
      GROUP_URL: "https://www.facebook.com/groups/1234825928691234",
      ELIGIBLE_PRODUCT_IDS: [
        "03f92ff3-aa7c-43fb-b860-7c97046d6006", // Class 8 Diamond
        "7d8f10c3-22fa-49dd-a387-0f7f05418768", // Class 8 Gold July
        "3ff37b15-50b1-4b68-b6c2-7ffe3ba03e48"  // Class 8 (General)
      ]
    },
    "Class 9": {
      YEAR: 2025,
      GROUP_URL: "https://www.facebook.com/groups/1895113984369381",
      ELIGIBLE_PRODUCT_IDS: [
        "19e7c5ff-d9c1-43f1-8e0e-98d4eaf1d26e", // Class 9 Diamond
        "b6e8dd78-252b-4f84-912e-6f971afaea4b", // Class 9 Gold July
        "e225c7d2-3d32-4c15-8952-6326ea90e38e", // Class 9 (General)
        "1c7b7206-bdca-400c-924d-630bc83d2aaf"  // Class 9 (Commerce)
      ]
    },
    "Class 10 FRB": {
      YEAR: 2025,
      GROUP_URL: "https://www.facebook.com/groups/2499286187104014",
      ELIGIBLE_PRODUCT_IDS: [
        "f9db6ff1-c365-4e29-a3a7-7d0bd9487c9c",
        "4e8f4314-2d70-48a6-8fb0-4384d735dce2",
        "d8787524-8ef5-4a22-a605-8d9a5a75eee4"
      ]
    },
    "Class 10 Commerce": {
      YEAR: 2025,
      GROUP_URL: "https://www.facebook.com/groups/1383777663750752",
      ELIGIBLE_PRODUCT_IDS: [
        "7baf4db8-9cfb-4e95-beaf-ea00b862630e" // Commerce only
      ]
    },

    // ===========================
    // Year 2026 (NEW) - fill these
    // ===========================
    "Class 6 (2026)": {
      YEAR: 2026,
      GROUP_URL: "", // TODO: put 2026 Class 6 group URL here
      ELIGIBLE_PRODUCT_IDS: [] // TODO: put 2026 Class 6 eligible product IDs here
    },
    "Class 7 (2026)": {
      YEAR: 2026,
      GROUP_URL: "",
      ELIGIBLE_PRODUCT_IDS: []
    },
    "Class 8 (2026)": {
      YEAR: 2026,
      GROUP_URL: "",
      ELIGIBLE_PRODUCT_IDS: []
    },
    "Class 9 (2026)": {
      YEAR: 2026,
      GROUP_URL: "",
      ELIGIBLE_PRODUCT_IDS: []
    },
    "Class 10 FRB (2026)": {
      YEAR: 2026,
      GROUP_URL: "",
      ELIGIBLE_PRODUCT_IDS: []
    },
    "Class 10 Commerce (2026)": {
      YEAR: 2026,
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
  INFO_AUTO_QUIT_TRIGGERED: "অটো-কুইট: কোন সদস্য অনুরোধ নেই",
  INFO_AUTO_QUIT_COUNTDOWN: "অটো-কুইট কাউন্টডাউন",

  // ===========================================
  // TIMING SETTINGS (in milliseconds)
  // ===========================================
  WAIT_TIME: 3000, // Single wait time for all operations (3 seconds)
  
  // ===========================================
  // AUTO-QUIT SETTINGS
  // ===========================================
  AUTO_QUIT_WHEN_NO_REQUESTS: true, // Automatically quit tab when no requests are found
  AUTO_QUIT_MAX_CYCLES: 0, // Maximum number of cycles with no requests before quitting (0 = quit immediately)

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  normalizeClassName: function (className) {
    const name = String(className || "").trim();
    // Backward-compat: old label -> new label
    if (name === "Class 10 Science") return "Class 10 FRB";
    return name;
  },

  isClassConfigured: function (className) {
    const normalizedClassName = this.normalizeClassName(className);
    const classConfig = this.CLASSES[normalizedClassName];
    if (!classConfig) return false;
    return Boolean(classConfig.GROUP_URL) && Array.isArray(classConfig.ELIGIBLE_PRODUCT_IDS) && classConfig.ELIGIBLE_PRODUCT_IDS.length > 0;
  },

  setSelectedClass: function(className) {
    const normalizedClassName = this.normalizeClassName(className);
    if (this.CLASSES[normalizedClassName]) {
      this.SELECTED_CLASS = normalizedClassName;
      this.GROUP_URL = this.buildGroupUrl(this.CLASSES[normalizedClassName].GROUP_URL);
      this.ELIGIBLE_PRODUCT_IDS = this.CLASSES[normalizedClassName].ELIGIBLE_PRODUCT_IDS;
      console.log(`✅ Selected class: ${normalizedClassName}`);
      console.log(`📍 Group URL: ${this.GROUP_URL}`);
      console.log(`🆔 Eligible Product IDs: ${this.ELIGIBLE_PRODUCT_IDS.length} items`);
      return true;
    } else {
      console.error(`❌ Class "${className}" not found in configuration`);
      return false;
    }
  },

  getAvailableClasses: function() {
    return Object.keys(this.CLASSES).sort((a, b) => {
      const yearA = Number(this.CLASSES[a]?.YEAR || 0);
      const yearB = Number(this.CLASSES[b]?.YEAR || 0);
      if (yearA !== yearB) return yearA - yearB;
      return a.localeCompare(b);
    });
  },

  getAvailableYears: function () {
    const years = new Set();
    Object.keys(this.CLASSES).forEach((className) => {
      const y = this.CLASSES[className]?.YEAR;
      if (y) years.add(Number(y));
    });
    return Array.from(years).sort((a, b) => a - b);
  },

  getClassesByYear: function (year) {
    const y = Number(year);
    return this.getAvailableClasses().filter((className) => Number(this.CLASSES[className]?.YEAR) === y);
  },

  getConfiguredClassesByYear: function (year) {
    return this.getClassesByYear(year).filter((className) => this.isClassConfigured(className));
  },

  updateClassConfig: function(className, groupUrl, eligibleIds) {
    const normalizedClassName = this.normalizeClassName(className);
    if (this.CLASSES[normalizedClassName]) {
      // Accept base group URL or full member-requests URL; always normalize to full URL.
      this.CLASSES[normalizedClassName].GROUP_URL = this.buildGroupUrl(groupUrl);
      this.CLASSES[normalizedClassName].ELIGIBLE_PRODUCT_IDS = eligibleIds;
      console.log(`✅ Updated configuration for ${normalizedClassName}`);
      return true;
    } else {
      console.error(`❌ Class "${className}" not found`);
      return false;
    }
  }
};

// Normalize configured class URLs on load so callers can safely use CLASSES[className].GROUP_URL
// even if the user provided only the base group URL.
Object.keys(config.CLASSES).forEach((className) => {
  const classConfig = config.CLASSES[className];
  if (classConfig && classConfig.GROUP_URL) {
    classConfig.GROUP_URL = config.buildGroupUrl(classConfig.GROUP_URL);
  }
});

console.log('✅ Configuration loaded successfully');

module.exports = config;
