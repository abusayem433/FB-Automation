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
    // Year 2026 (NEW) - Each course has its own group and product ID
    // ===========================
    "Class 6 All in One Diamond Pack (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/868968296117348",
      ELIGIBLE_PRODUCT_IDS: [
        "ac2df497-1952-489b-86ae-d2b06971b2d0", // All in One Diamond Pack
        "225b3979-80ea-42d8-8aaf-17c6b611f50e"  // 1st Half Variant
      ]
    },
    "Class 7 All in One Diamond Pack (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/868470315809067",
      ELIGIBLE_PRODUCT_IDS: [
        "d197edde-1214-4c5f-a985-4733606a5d41", // All in One Diamond Pack
        "fab4550d-92f0-4ec5-b3b0-c5cbf351f3a9"  // 1st Half Variant
      ]
    },
    "Class 8 All in One Diamond Pack (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1970734573863976",
      ELIGIBLE_PRODUCT_IDS: [
        "01818359-2397-48e8-ad22-7e54231c5f55", // All in One Diamond Pack
        "861cd588-1334-4eab-9b2c-c4af065530d5"  // 1st Half Variant
      ]
    },
    "Class 9 All in One Diamond Pack (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/810998795294892",
      ELIGIBLE_PRODUCT_IDS: [
        "01f3d2e5-aa97-4b8b-8bf9-c38263fcaa90", // All in One Diamond Pack
        "c04cd38b-ae05-4edc-967f-85f50c069ab3"  // 1st Half Variant
      ]
    },
    "Class 9 PCMMB (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1778678356659872",
      ELIGIBLE_PRODUCT_IDS: [
        "c5e35f9e-24e5-4109-871c-9f439edd8397"
      ]
    },
    "Class 9 EBIB (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1895847297683984",
      ELIGIBLE_PRODUCT_IDS: [
        "10225dc4-f51b-4bf7-9689-00eca46d42d3"
      ]
    },
    "Class 9 Manobik Group (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1060344562904514",
      ELIGIBLE_PRODUCT_IDS: [
        "01f3d2e5-aa97-4b8b-8bf9-c38263fcaa90"
      ]
    },
    "Class 9 Bangla (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/3809578092680972",
      ELIGIBLE_PRODUCT_IDS: [
        "6c831740-db99-4d2f-82b4-ed56f9f48c96"
      ]
    },
    "Class 9 English (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1816987975688074",
      ELIGIBLE_PRODUCT_IDS: [
        "e562c8f7-5ad6-4a88-8304-5cbfc10d04fd"
      ]
    },
    "Class 9 Math (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1368266384978571",
      ELIGIBLE_PRODUCT_IDS: [
        "e47fabc0-5c80-450f-96fc-5ae868cff0b5"
      ]
    },
    "Class 9 H. Math (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1673420517365186",
      ELIGIBLE_PRODUCT_IDS: [
        "65a57561-f6d5-4a3a-bcff-f65c92ea2d19"
      ]
    },
    "Class 9 Chemistry (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1533578947939959",
      ELIGIBLE_PRODUCT_IDS: [
        "edb8bc8a-f2e5-44d5-8537-0facd2ffb169"
      ]
    },
    "Class 9 Physics (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1769456690402494",
      ELIGIBLE_PRODUCT_IDS: [
        "a4bad5c0-8ecc-467e-9eb0-789cd8d92533"
      ]
    },
    "Class 9 Biology (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1852061998748203",
      ELIGIBLE_PRODUCT_IDS: [
        "b19d80f3-c6ee-44e0-a04d-44b19eb63094"
      ]
    },
    "Class 9 ICT (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1943626956549236",
      ELIGIBLE_PRODUCT_IDS: [
        "f57dfc8e-2cca-4aa0-8512-1854a936a791"
      ]
    },
    "Class 9 BGS (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/2139552100183761",
      ELIGIBLE_PRODUCT_IDS: [
        "18420a99-3d88-44b7-91ee-2014c2f79d09"
      ]
    },
    "Class 10 All in One Diamond Pack (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/890350350310388",
      ELIGIBLE_PRODUCT_IDS: [
        "b46bfa87-ead0-4c07-b391-38dc21437ae8", // All in One Diamond Pack
        "04cfec90-9c44-4a3c-a7b5-d173a2b21f5b"  // 1st Half Variant
      ]
    },
    "Class 10 PCMMB (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/870311869183420",
      ELIGIBLE_PRODUCT_IDS: [
        "e9bb39a3-db73-4853-a5d4-65d7c8343c99"
      ]
    },
    "Class 10 EBIB (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1208035577561286",
      ELIGIBLE_PRODUCT_IDS: [
        "b0273f47-08ae-457b-8740-7ac062d82e3a"
      ]
    },
    "Class 10 Manobik Group (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1396235251373803",
      ELIGIBLE_PRODUCT_IDS: [
        "cfa9442c-61cb-46cd-a833-df51c377520b"
      ]
    },
    "Class 10 Bangla (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1572158680592447",
      ELIGIBLE_PRODUCT_IDS: [
        "f13885fe-3ec5-4d1f-9550-82967c480518"
      ]
    },
    "Class 10 English (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/4293244720913836",
      ELIGIBLE_PRODUCT_IDS: [
        "15856b4b-56b1-4a4d-9a58-4f3a4384771c"
      ]
    },
    "Class 10 Math (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/813129001762917",
      ELIGIBLE_PRODUCT_IDS: [
        "be2e3736-9c4f-4093-b7dd-1aa97c464541"
      ]
    },
    "Class 10 H. Math (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1585558069427450",
      ELIGIBLE_PRODUCT_IDS: [
        "a3e31225-d3ce-48f5-b9d9-f69e364f2728"
      ]
    },
    "Class 10 Chemistry (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1507748403649294",
      ELIGIBLE_PRODUCT_IDS: [
        "fbeecbd7-98a9-40a5-a5f5-070c9b3a0fc1"
      ]
    },
    "Class 10 Physics (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1275819601043619",
      ELIGIBLE_PRODUCT_IDS: [
        "1e2be909-7d3d-422f-92a1-2c7b58fc8833"
      ]
    },
    "Class 10 Biology (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1359440438818330",
      ELIGIBLE_PRODUCT_IDS: [
        "9a67df11-f3e2-4aa9-91a3-234328a2a10c"
      ]
    },
    "Class 10 ICT (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/1300801925419054",
      ELIGIBLE_PRODUCT_IDS: [
        "197030f1-24dd-48ee-9b0c-4452167d4850"
      ]
    },
    "Class 10 BGS (2026)": {
      YEAR: 2026,
      GROUP_URL: "https://www.facebook.com/groups/26155175174080162",
      ELIGIBLE_PRODUCT_IDS: [
        "e1160e9e-fe5c-4611-96ab-662a92112c4f"
      ]
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
