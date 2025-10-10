// Class Configuration Setup Helper
// Use this script to easily configure your classes with group URLs and eligible product IDs

const config = require('./config.js');

// Example usage - uncomment and modify the lines below to configure your classes:

// Configure Class 6
// config.updateClassConfig("Class 6", 
//   "https://www.facebook.com/groups/YOUR_GROUP_ID/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
//   ["product-id-1", "product-id-2", "product-id-3"]
// );

// Configure Class 7
// config.updateClassConfig("Class 7", 
//   "https://www.facebook.com/groups/YOUR_GROUP_ID/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
//   ["product-id-1", "product-id-2", "product-id-3"]
// );

// Configure Class 8
// config.updateClassConfig("Class 8", 
//   "https://www.facebook.com/groups/YOUR_GROUP_ID/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
//   ["product-id-1", "product-id-2", "product-id-3"]
// );

// Configure Class 9
// config.updateClassConfig("Class 9", 
//   "https://www.facebook.com/groups/YOUR_GROUP_ID/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
//   ["product-id-1", "product-id-2", "product-id-3"]
// );

// Configure Class 10 Science
// config.updateClassConfig("Class 10 Science", 
//   "https://www.facebook.com/groups/YOUR_GROUP_ID/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
//   ["product-id-1", "product-id-2", "product-id-3"]
// );

// Configure Class 10 Commerce
// config.updateClassConfig("Class 10 Commerce", 
//   "https://www.facebook.com/groups/YOUR_GROUP_ID/member-requests?joined_fb_recently=false&orderby=chronological&previously_removed_members=false&suggested=false",
//   ["product-id-1", "product-id-2", "product-id-3"]
// );

console.log('\n🎓 Class Configuration Helper');
console.log('==============================');
console.log('To configure your classes:');
console.log('1. Edit this file (setup_classes.js)');
console.log('2. Uncomment the lines for the classes you want to configure');
console.log('3. Replace YOUR_GROUP_ID with the actual Facebook group ID');
console.log('4. Replace the product-id placeholders with actual product IDs');
console.log('5. Run: node setup_classes.js');
console.log('');
console.log('Current class configurations:');
console.log('==============================');

const classes = config.getAvailableClasses();
classes.forEach(className => {
  const classConfig = config.CLASSES[className];
  const isConfigured = classConfig.GROUP_URL && classConfig.ELIGIBLE_PRODUCT_IDS.length > 0;
  console.log(`${className}: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  if (isConfigured) {
    console.log(`  - Group URL: ${classConfig.GROUP_URL.substring(0, 50)}...`);
    console.log(`  - Product IDs: ${classConfig.ELIGIBLE_PRODUCT_IDS.length} items`);
  }
});

console.log('\n💡 Tip: You can also directly edit config.js to add your configurations.');
