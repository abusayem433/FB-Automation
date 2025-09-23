# Facebook Automation Configuration Guide

This guide explains how to customize the Facebook automation system by editing the configuration files.

## Configuration Files

### 1. `config.js` - Application Settings
All customizable settings are in the `config.js` file. You can edit this file to change:

- Decline messages (in Bangla)
- Group URL
- Timing settings
- Success/info messages

### 2. `.env` - Database Settings
Database connection settings are in the `.env` file. You can edit this file to change:

- Database host
- Database port
- Database name
- Database username
- Database password

## How to Edit

### Application Settings (`config.js`)
1. Open `config.js` in any text editor (VS Code, Notepad++, etc.)
2. Find the setting you want to change
3. Edit the value after the `:` sign (keep the quotes)
4. Save the file
5. Restart the automation script

### Database Settings (`.env`)
1. Copy `.env.example` to `.env` (if `.env` doesn't exist)
2. Open `.env` in any text editor
3. Update the database connection values
4. Save the file
5. Restart the automation script

## Available Settings

### Group Settings
- `GROUP_URL` - The Facebook group member requests URL

### Decline Messages (in Bangla)
- `DECLINE_ALREADY_APPROVED` - এই ট্রানজেকশন আইডি ব্যবহৃত হয়েছে
- `DECLINE_PHONE_MISMATCH` - ফোন নম্বরটি এই ট্রানজেকশন আইডির জন্য সঠিক নয়
- `DECLINE_TRANSACTION_NOT_FOUND` - ট্রানজেকশন আইডি সঠিক নয়
- `DECLINE_NO_ANSWERS` - প্রশ্নের উত্তর দেওয়া হয়নি
- `DECLINE_MISSING_PHONE` - ফোন নম্বর দেওয়া হয়নি
- `DECLINE_MISSING_TRANSACTION` - ট্রানজেকশন আইডি দেওয়া হয়নি
- `DECLINE_MISSING_BOTH` - ট্রানজেকশন আইডি ও ফোন নম্বর দেওয়া হয়নি
- `DECLINE_DATABASE_ERROR` - টেকনিক্যাল ত্রুটির কারণে ডিক্লাইন হয়েছে

### Timing Settings (in milliseconds)
- `WAIT_NO_MEMBERS` - Wait time when no members found (default: 600000 = 10 minutes)
- `WAIT_BETWEEN_MEMBERS` - Wait time between processing members (default: 30000 = 30 seconds)
- `WAIT_ON_ERROR` - Wait time on error before retry (default: 120000 = 2 minutes)
- `WAIT_BETWEEN_ACTIONS` - Wait time between individual actions (default: 3000 = 3 seconds)

### Database Settings (`.env`)
- `DB_HOST` - Database server hostname
- `DB_PORT` - Database server port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

## Examples

### Change Group URL
```javascript
GROUP_URL: 'https://www.facebook.com/groups/your-group-name/member-requests',
```

### Change Decline Message
```javascript
DECLINE_NO_ANSWERS: 'আপনার প্রশ্নের উত্তর দেওয়া হয়নি',
```

### Change Wait Time (5 minutes instead of 10)
```javascript
WAIT_NO_MEMBERS: 300000,  // 5 minutes
```

### Change Database Settings
```env
DB_HOST=your-new-database-host.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_secure_password
```

## Important Notes

### For `config.js`:
- Keep the quotes around text values
- Don't delete the `:` sign
- Don't delete the commas at the end of lines
- Lines starting with `//` are comments and will be ignored

### For `.env`:
- Don't use quotes around values
- Don't add spaces around the `=` sign
- Lines starting with `#` are comments and will be ignored
- Never commit the `.env` file to version control (it contains sensitive data)

### General:
- The script will show "✅ Configuration loaded successfully" when working
- Changes take effect immediately when you restart the script

## Troubleshooting

If the script doesn't work after editing the config:

1. Check that you didn't accidentally delete the `:` sign
2. Make sure all text values are in quotes
3. Make sure there are commas at the end of each line
4. Restart the script completely
5. Check the console output for any error messages

The script will show "✅ Configuration loaded successfully" if everything is working correctly.
