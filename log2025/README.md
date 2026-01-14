# FB Automation - JSON Logs

This directory contains JSON log files for all member approvals and declines.

## File Structure

For each class, there are two separate JSON files:

### Approval Logs
- `Class_6_approvals.json`
- `Class_7_approvals.json`
- `Class_8_approvals.json`
- `Class_9_approvals.json`
- `Class_10_FRB_approvals.json`
- `Class_10_Commerce_approvals.json`

### Decline Logs
- `Class_6_declines.json`
- `Class_7_declines.json`
- `Class_8_declines.json`
- `Class_9_declines.json`
- `Class_10_FRB_declines.json`
- `Class_10_Commerce_declines.json`

## Log Entry Format

Each entry in the JSON files contains the following fields:

```json
{
  "timestamp": "2025-10-11T12:34:56.789Z",
  "date": "10/11/2025, 12:34:56 PM",
  "className": "Class 10 FRB",
  "memberName": "John Doe",
  "facebookUserId": "100012345678901",
  "memberUserId": "159167",
  "memberPhone": "01712345678",
  "memberTrxId": "abc123-def456-ghi789",
  "memberQA": {
    "Question 1": "Answer 1",
    "Question 2": "Answer 2"
  },
  "approvalStatus": "approved",
  "declineReason": null,
  "processedBy": "FB-Automation"
}
```

### Field Descriptions

- **timestamp**: ISO 8601 format timestamp
- **date**: Human-readable date and time
- **className**: The class/group this member request belongs to
- **memberName**: Name of the person requesting to join
- **facebookUserId**: Facebook user ID extracted from profile link
- **memberUserId**: User ID from the database (for approved members)
- **memberPhone**: Phone number provided in the request
- **memberTrxId**: Transaction ID provided in the request
- **memberQA**: All questions and answers from the member request
- **approvalStatus**: Status of the request (approved, declined, missing_info, no_answers, database_error)
- **declineReason**: Reason for decline (null for approvals)
- **processedBy**: System that processed the request

## Usage

These JSON files can be used for:
- Analytics and reporting
- Auditing member approvals/declines
- Training machine learning models
- Importing into other systems
- Generating statistics and insights

## Notes

- Files are updated in real-time as members are processed
- Each file is an array of log entries
- Files are formatted with 2-space indentation for readability
- Log files are separate from the database logs (these are local storage only)

