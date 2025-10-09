# Analytics Dashboard Setup Guide

## Overview

The Analytics Dashboard provides comprehensive metrics and insights for administrators and analytics users. This guide explains how to set up and configure access to the analytics features.

## Features

### 1. **Metrics Summary Dashboard**
- Total Users
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Sessions per day
- Conversations per day
- Average session duration

### 2. **Daily Metrics Table**
- Date-by-date breakdown
- User growth tracking (new users per day)
- Session counts
- Conversation metrics
- Engagement ratios (conversations per session, messages per conversation)
- **Data Export**: Download as CSV or JSON

### 3. **Database Table Browser**
- View all BigQuery tables in your dataset
- See table metadata (row count, size, last modified)
- Browse sample data from any table
- **Export Sample Data**: Download table samples as CSV or JSON

## Access Control

### User Roles

The system supports three user roles:

1. **Admin** - Full access to all features including analytics
2. **Analytics** - Access to analytics dashboard only
3. **User** - Standard user access (no analytics)

### Configuration

Add the following environment variables to your `.env` file:

```bash
# Comma-separated list of admin emails
ADMIN_EMAILS=admin@yourdomain.com,cto@yourdomain.com

# Comma-separated list of analytics user emails
ANALYTICS_EMAILS=analyst@yourdomain.com,data@yourdomain.com
```

### How It Works

1. When a user logs in, their email is checked against the `ADMIN_EMAILS` and `ANALYTICS_EMAILS` lists
2. Users with admin or analytics roles can access `/analytics`
3. Regular users trying to access `/analytics` are redirected with an access denied error
4. All analytics API endpoints verify user permissions before returning data

## API Endpoints

### Summary Metrics
```
GET /api/analytics/summary
```
Returns overall metrics summary.

**Response:**
```json
{
  "total_users": 1456,
  "daily_active_users": 342,
  "monthly_active_users": 1089,
  "total_sessions_today": 728,
  "total_conversations_today": 1243,
  "avg_session_duration_minutes": 12.5
}
```

### Daily Metrics
```
GET /api/analytics/daily?days=30
```
Returns daily metrics for the specified number of days (default: 30, max: 365).

**Response:**
```json
[
  {
    "date": "2025-01-09",
    "total_users": 1456,
    "new_users": 23,
    "total_sessions": 728,
    "total_conversations": 1243,
    "avg_conversations_per_session": 1.71,
    "avg_messages_per_conversation": 12.3
  },
  ...
]
```

### Tables List
```
GET /api/analytics/tables
```
Returns list of all tables in the BigQuery dataset.

**Response:**
```json
[
  {
    "name": "users",
    "description": "User profiles and authentication data",
    "row_count": 1456,
    "size_mb": 2.3,
    "last_modified": "2025-01-09T10:00:00.000Z"
  },
  ...
]
```

### Table Sample Data
```
GET /api/analytics/table-sample?table=users&limit=10&format=json
```
Returns sample data from a specific table.

**Parameters:**
- `table` (required): Table name
- `limit` (optional): Number of rows to return (default: 10, max: 1000)
- `format` (optional): Response format - `json`, `csv`, or `json-download` (default: `json`)

## Sample Data vs. Real Data

The analytics system is designed to work with or without BigQuery integration:

- **With BigQuery**: Fetches real data from your BigQuery dataset
- **Without BigQuery**: Generates realistic sample data for demonstration purposes

This allows you to:
1. Test the analytics dashboard before setting up BigQuery
2. Demo the features to stakeholders
3. Develop and test new analytics features locally

## Data Export Features

### Daily Metrics Export

Users can export daily metrics in two formats:

1. **CSV**: Spreadsheet-compatible format
   - Click "CSV" button in the Daily Metrics section
   - File: `daily_metrics_<days>d.csv`

2. **JSON**: Machine-readable format for APIs
   - Click "JSON" button in the Daily Metrics section
   - File: `daily_metrics_<days>d.json`

### Table Sample Export

Users can export sample data from any table:

1. **CSV**: For analysis in Excel, Google Sheets, etc.
   - Select a table from the Database Tables section
   - Click "CSV" button in the sample data view
   - File: `<tablename>_sample.csv`

2. **JSON**: For programmatic processing
   - Select a table from the Database Tables section
   - Click "JSON" button in the sample data view
   - File: `<tablename>_sample.json`

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **Email Verification**: Keep admin/analytics email lists up to date
3. **API Authentication**: All analytics endpoints verify session authentication
4. **Role-Based Access**: Implement the principle of least privilege
5. **Audit Logging**: Consider adding audit logs for analytics access

## Customization

### Adding New Metrics

To add new metrics to the dashboard:

1. Update the data generation in `src/lib/analytics.ts`:
   ```typescript
   export function generateSampleDailyMetrics(days: number): DailyMetrics[] {
     // Add your new metric fields here
   }
   ```

2. Update the TypeScript interfaces:
   ```typescript
   export interface DailyMetrics {
     // Add new fields here
     your_new_metric: number;
   }
   ```

3. Update the dashboard component to display the new metrics

### Connecting to Real BigQuery Data

To use real BigQuery data instead of sample data:

1. Ensure your BigQuery dataset is set up with proper tables
2. Set the `GOOGLE_CLOUD_PROJECT` environment variable
3. Update the queries in `src/lib/analytics.ts` to match your schema
4. The system will automatically try to fetch real data and fall back to samples on error

## Time Ranges

The dashboard supports three time range views:
- **Last 7 days**: Quick daily snapshot
- **Last 30 days**: Monthly trends (default)
- **Last 90 days**: Quarterly analysis

Users can switch between time ranges using the dropdown in the top-right corner.

## Troubleshooting

### "Forbidden: Analytics access required" Error

**Cause**: User email not in ADMIN_EMAILS or ANALYTICS_EMAILS list

**Solution**: Add the user's email to one of the lists in your `.env` file and restart the application

### No Data Showing

**Cause**: BigQuery connection issues or no data in tables

**Solution**: The system will automatically show sample data. Check:
1. BigQuery dataset exists
2. Tables have data
3. Service account has proper permissions

### Export Downloads Not Working

**Cause**: API endpoint issues or format parameter problems

**Solution**: Check browser console for errors and ensure:
1. User is authenticated
2. Table name is valid
3. Format parameter is correct (`csv` or `json-download`)

## Future Enhancements

Potential improvements for the analytics dashboard:

1. **Real-time Updates**: WebSocket integration for live metrics
2. **Custom Date Ranges**: Allow users to select specific date ranges
3. **Advanced Visualizations**: Charts and graphs using D3.js or Chart.js
4. **Query Builder**: Allow users to run custom BigQuery queries
5. **Scheduled Reports**: Email reports on a schedule
6. **Comparison Views**: Compare time periods (e.g., this month vs. last month)
7. **Export All Tables**: Bulk export functionality
8. **Filtering and Search**: Filter metrics by user segments or other criteria

## Support

For questions or issues with the analytics dashboard:
1. Check this documentation
2. Review the code comments in `src/lib/analytics.ts`
3. Test with sample data first
4. Verify environment variables are set correctly

