# 🔒 CONFIDENTIAL - Flow Feedback Widget SDK

**⚠️ PROPRIETARY - DO NOT DISTRIBUTE PUBLICLY**

## Overview

Embeddable Stella feedback widget with viral sharing mechanics. Enables any web application to collect feedback with beautiful UI annotations and create viral network effects.

**Competitive Advantage:** This SDK enables multi-tenant deployment while maintaining the viral loop proprietary advantage.

---

## Installation

### NPM (Private Registry)

```bash
npm install @flow/feedback-widget
```

### Script Tag (CDN)

```html
<script src="https://cdn.flow.ai/widget/v1/stella-feedback.js"></script>
```

---

## Quick Start

### React Component

```tsx
import { StellaFeedbackWidget } from '@flow/feedback-widget';

function MyApp() {
  return (
    <div>
      <h1>My Application</h1>
      
      {/* Add Stella widget */}
      <StellaFeedbackWidget
        companyId="your-company-id"
        userId="current-user-id"
        apiKey="your-public-api-key"
        position="bottom-right"
        theme="light"
        language="es"
        onTicketCreated={(ticketId, shareUrl) => {
          console.log('Ticket created:', ticketId);
          // Optional: Show toast notification
        }}
      />
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>My Application</h1>
  
  <!-- Load widget -->
  <script src="https://cdn.flow.ai/widget/v1/stella-feedback.js"></script>
  
  <!-- Initialize -->
  <script>
    StellaFeedback.init({
      companyId: 'your-company-id',
      userId: 'current-user-id',
      apiKey: 'your-public-api-key',
      position: 'bottom-right',
      theme: 'light',
      language: 'es',
      
      // Callbacks
      onTicketCreated: function(ticketId, shareUrl) {
        console.log('Feedback ticket:', ticketId);
      }
    });
  </script>
</body>
</html>
```

---

## Configuration

### Required Options

```typescript
{
  companyId: string;      // Your Flow company ID
  userId: string;         // Current authenticated user
  apiKey: string;         // Public API key (read-only)
}
```

### Optional Options

```typescript
{
  // UI Customization
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  language?: 'en' | 'es' | 'pt';
  primaryColor?: string;  // HEX color
  
  // Features
  enableStellaMarker?: boolean;      // Default: true
  enableScreenshots?: boolean;       // Default: true
  enableAnnotations?: boolean;       // Default: true
  enableSharing?: boolean;           // Default: true (PROPRIETARY)
  
  // Behavior
  autoCapturePage?: boolean;         // Default: false
  welcomeMessage?: string;
  
  // Callbacks
  onSessionStart?: (sessionId: string) => void;
  onTicketCreated?: (ticketId: string, shareUrl: string) => void;
  onShared?: (ticketId: string, platform: string) => void;
  onUpvote?: (ticketId: string) => void;
}
```

---

## API Methods

### Widget Control

```typescript
// Show widget
StellaFeedback.show();

// Hide widget
StellaFeedback.hide();

// Toggle widget
StellaFeedback.toggle();

// Destroy widget
StellaFeedback.destroy();
```

### Stella Marker Control

```typescript
// Activate Stella marker tool
StellaFeedback.activateStellaTool();

// Deactivate Stella marker tool
StellaFeedback.deactivateStellaTool();

// Programmatically place marker
StellaFeedback.placeMarker({
  x: 100,
  y: 200,
  feedback: 'This button is confusing'
});
```

### Ticket Management

```typescript
// Get user's tickets
const tickets = await StellaFeedback.getMyTickets();

// Get specific ticket
const ticket = await StellaFeedback.getTicket('FEAT-1234');

// Upvote ticket
await StellaFeedback.upvote('FEAT-1234');

// Share ticket
const shareUrl = await StellaFeedback.share('FEAT-1234', 'slack');
```

---

## Styling

### Custom Theme

```typescript
StellaFeedback.init({
  // ... other config
  
  customTheme: {
    // Colors
    primaryColor: '#a855f7',         // Purple
    secondaryColor: '#fbbf24',       // Yellow
    accentColor: '#10b981',          // Green
    
    // Stella marker colors (PROPRIETARY)
    stellaColors: {
      purple: '#a855f7',
      yellow: '#fbbf24',
      green: '#10b981',
      blue: '#3b82f6',
    },
    
    // Fonts
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
    },
    
    // Spacing
    borderRadius: '0.5rem',
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
    },
  }
});
```

### CSS Variables

```css
:root {
  --stella-primary: #a855f7;
  --stella-secondary: #fbbf24;
  --stella-accent: #10b981;
  --stella-submit: #3b82f6;
  
  --stella-animation-duration: 2s;
  --stella-glow-opacity: 0.6;
}
```

---

## Security

### API Key Management

**Public API Key (Client-side):**
- ✅ Read-only access
- ✅ Rate limited per domain
- ✅ Can only create feedback
- ❌ Cannot read other users' data
- ❌ Cannot modify settings

**Example:**
```typescript
// Generate public API key (admin only)
const apiKey = await StellaAdmin.generatePublicKey({
  companyId: 'your-company',
  allowedDomains: ['yourapp.com', '*.yourapp.com'],
  rateLimit: {
    feedbackPerDay: 1000,
    requestsPerMinute: 60,
  },
});
```

### Domain Whitelisting

```typescript
// Only allow widget on specific domains
StellaFeedback.init({
  // ... config
  allowedDomains: [
    'https://yourapp.com',
    'https://app.yourcompany.com',
  ],
});
```

---

## Privacy & Compliance

### Data Handling

**What the widget collects:**
- User ID (you provide)
- Feedback text
- Page URL
- Element context
- Viewport size
- Annotations

**What the widget does NOT collect:**
- Sensitive form data
- Passwords
- Payment information
- PII without consent

### GDPR Compliance

```typescript
// Show privacy notice
StellaFeedback.init({
  // ... config
  
  privacyNotice: {
    enabled: true,
    text: 'Feedback will be shared with your company team',
    link: 'https://yourcompany.com/privacy',
  },
  
  // Require consent
  requireConsent: true,
});
```

---

## Advanced Features

### Custom Annotations

```typescript
// Add custom annotation types
StellaFeedback.registerAnnotationType({
  name: 'important',
  icon: '⚡',
  color: '#ef4444',
  description: 'Mark as important',
});

// Use in feedback
StellaFeedback.placeMarker({
  x: 100,
  y: 200,
  feedback: 'Critical issue here',
  annotationType: 'important',
});
```

### Webhooks

```typescript
// Configure webhooks for events
StellaFeedback.init({
  // ... config
  
  webhooks: {
    onTicketCreated: 'https://yourapi.com/webhooks/stella/created',
    onTicketUpvoted: 'https://yourapi.com/webhooks/stella/upvoted',
    onTicketShared: 'https://yourapi.com/webhooks/stella/shared',
  },
});
```

### Analytics Integration

```typescript
// Track events in your analytics
StellaFeedback.on('ticket.created', (event) => {
  analytics.track('Stella Feedback Submitted', {
    ticketId: event.ticketId,
    type: event.type,
    length: event.feedback.length,
  });
});

StellaFeedback.on('ticket.shared', (event) => {
  analytics.track('Stella Ticket Shared', {
    ticketId: event.ticketId,
    platform: event.platform,
    viralDepth: event.shareDepth,
  });
});
```

---

## MCP Server Foundation

### Coming Soon: Model Context Protocol Server

**Purpose:** Allow AI assistants (Claude, ChatGPT, etc.) to interact with Flow feedback system

**Capabilities:**
```typescript
// Submit feedback via AI
await mcp.call('stella.submit_feedback', {
  feedback: 'Add dark mode',
  context: 'User working at night',
});

// Get ticket status via AI
const status = await mcp.call('stella.get_ticket', {
  ticketId: 'FEAT-1234',
});

// Analyze feedback trends via AI
const trends = await mcp.call('stella.analyze_trends', {
  timeframe: 'last_30_days',
});
```

**Implementation:** Q1 2026

---

## Examples

### E-commerce Site

```typescript
// Add to checkout page
<StellaFeedbackWidget
  companyId="ecommerce-corp"
  userId={currentUser.id}
  apiKey={process.env.NEXT_PUBLIC_STELLA_KEY}
  position="bottom-right"
  welcomeMessage="¿Problemas con el checkout? ¡Cuéntanos!"
/>
```

### SaaS Dashboard

```typescript
// Add to main dashboard
<StellaFeedbackWidget
  companyId="saas-company"
  userId={user.id}
  apiKey={STELLA_API_KEY}
  position="bottom-left"
  enableStellaMarker={true}
  enableSharing={true}  // Viral loop enabled
  onTicketCreated={(id, url) => {
    toast.success(`Ticket ${id} created! Share to accelerate: ${url}`);
  }}
/>
```

### Internal Tool

```typescript
// Add to admin panel
<StellaFeedbackWidget
  companyId="internal-tools"
  userId={admin.id}
  apiKey={ADMIN_STELLA_KEY}
  theme="dark"
  enableSharing={true}
  customTheme={{
    primaryColor: '#6366f1',  // Indigo for admin
  }}
/>
```

---

## Troubleshooting

### Widget not appearing

**Check:**
1. API key is valid
2. Domain is whitelisted
3. User ID is provided
4. No console errors

### Stella marker not working

**Check:**
1. `enableStellaMarker: true` in config
2. No z-index conflicts
3. Click handler not blocked by other overlays

### Sharing not working

**Check:**
1. `enableSharing: true` in config
2. Company SSO configured
3. Share platforms authorized
4. User has company email verified

---

## Support

**⚠️ CONFIDENTIAL - Internal support only**

- Email: dev@flow.ai (internal only)
- Slack: #stella-widget (private channel)
- Docs: https://docs.flow.ai/stella (internal)

---

## License

**PROPRIETARY - ALL RIGHTS RESERVED**

This software is confidential and proprietary to Flow AI. Unauthorized copying, distribution, or use is strictly prohibited and may result in legal action.

Copyright © 2025 Flow AI. All rights reserved.

---

**Last Updated:** 2025-10-27  
**Version:** 0.1.0 (Alpha)  
**Status:** 🔒 Internal Development Only

