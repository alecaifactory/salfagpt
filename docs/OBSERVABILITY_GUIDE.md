# PAME.AI Observability Guide

## Quick Start

### Local Development
```bash
# Terminal 1: Start emulators
npm run dev:emulator

# Terminal 2: Run dev server with emulators
npm run dev:local
```

### Production Monitoring
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View errors
gcloud error-reporting list --service-filter=pame-ai
```

## Logging Examples

### Basic Logging
```typescript
import { logger } from '../lib/logger';

// Info
await logger.info('User action completed', {
  userId: '123',
  action: 'update_profile'
});

// Warning
await logger.warn('Rate limit approaching', {
  userId: '123',
  remaining: 10
});

// Error
await logger.error('Database query failed', error, {
  query: 'SELECT * FROM users',
  userId: '123'
});
```

### Performance Tracking
```typescript
import { logger } from '../lib/logger';

const timer = logger.startTimer();

// ... your code ...
const result = await someOperation();

// Log performance metric
const duration = await timer.end('operation_name', {
  userId: '123',
  recordsProcessed: result.length
});

// Returns duration in milliseconds
console.log(`Operation took ${duration}ms`);
```

### Error Reporting
```typescript
import { reportError, withErrorReporting } from '../lib/error-reporting';

// Manual reporting
try {
  await dangerousOperation();
} catch (error) {
  await reportError(error, {
    userId: '123',
    action: 'dangerous_operation'
  });
  throw error;
}

// Automatic wrapper
export const POST = withErrorReporting(async ({ request }) => {
  // Errors automatically reported
  const data = await request.json();
  return { success: true };
}, { endpoint: '/api/example' });
```

## Cloud Console Queries

### Find All Chat Requests
```
resource.type="cloud_run_revision"
jsonPayload.action="chat_request"
```

### Find Errors
```
resource.type="cloud_run_revision"
severity="ERROR"
```

### Find Slow Requests (>2 seconds)
```
resource.type="cloud_run_revision"
jsonPayload.duration_ms>2000
```

### Find User Activity
```
resource.type="cloud_run_revision"
jsonPayload.userId="user_abc123"
```

## Emulator UI

Access the Firebase Emulator UI at: http://localhost:4000

**Features:**
- View and manage Firestore data
- Monitor Pub/Sub messages
- Reset emulator state
- Export/import data

## Best Practices

### DO ✅
- Use structured logging with metadata
- Track performance of critical paths
- Sanitize sensitive data before logging
- Use appropriate severity levels
- Add context to errors

### DON'T ❌
- Log passwords, tokens, or API keys
- Log full user emails (use hashed IDs)
- Create logs in tight loops (use sampling)
- Block on logging operations (use async)
- Log large payloads (truncate or summarize)

## Troubleshooting

### Logs Not Appearing in Cloud Console
1. Check `NODE_ENV=production` is set
2. Verify Cloud Logging API is enabled
3. Check service account has `roles/logging.logWriter`

### Emulators Not Starting
```bash
# Reinstall firebase-tools
npm install -g firebase-tools

# Check Java is installed (required for emulators)
java -version

# If missing, install Java:
brew install openjdk@11
```

### Performance Issues
- Logging adds ~5-10ms per request in production
- If critical, set `NODE_ENV=development` temporarily
- Consider log sampling for high-traffic endpoints

## Metrics Dashboard

Track these key metrics:
- **chat_request_total** - End-to-end chat latency
- **ai_generation** - Gemini API latency
- **analytics_summary_request** - Analytics query time
- Error rate by endpoint
- P95/P99 latency by operation

## Support

- Cloud Logging: https://cloud.google.com/logging/docs
- Error Reporting: https://cloud.google.com/error-reporting/docs
- Firebase Emulators: https://firebase.google.com/docs/emulator-suite



