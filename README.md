# 🤖 SalfaGPT

AI-powered conversational web application built with Astro, Google Cloud Platform, and Vertex AI.

## ✨ Features

- 🔐 **Secure Google OAuth authentication**
- 💬 **ChatGPT-like interface** for AI conversations
- 📊 **Analytics Dashboard** (admin/analytics users only)
  - Daily, monthly, and yearly metrics
  - User engagement tracking
  - Data export (CSV/JSON)
  - BigQuery table browser
- ☁️ **Google Cloud Platform integration**
  - BigQuery for data storage
  - Vertex AI for AI/LLM capabilities
  - Cloud Run ready for deployment
- 🎨 **Modern, responsive UI** with Tailwind CSS
- 🔒 **Security best practices** implemented
  - HTTPOnly cookies
  - JWT token authentication
  - Role-based access control
  - Secure session management
  - CSRF protection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Google Cloud Platform account
- Google OAuth credentials ([setup guide](./OAUTH_CONFIG.md))

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd salfagpt
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials (see [SETUP.md](./SETUP.md))

3. **Set up BigQuery:**
   ```bash
   npm run setup:bigquery
   ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

5. **Visit:** `http://localhost:3000`

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[OAUTH_CONFIG.md](./OAUTH_CONFIG.md)** - OAuth configuration reference
- **[docs/ANALYTICS_SETUP.md](./docs/ANALYTICS_SETUP.md)** - Analytics dashboard setup and usage
- **[Architecture](#architecture)** - System architecture overview

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Landing   │  │  Auth Flow   │  │   Chat UI       │   │
│  │   Page      │  │  (OAuth)     │  │   (Home)        │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Astro SSR Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Auth Routes  │  │  API Routes  │  │  Middleware     │  │
│  │ - Login      │  │  - /api/chat │  │  - Sessions     │  │
│  │ - Callback   │  │  - /api/     │  │  - Auth Check   │  │
│  │ - Logout     │  │    analytics │  │  - RBAC         │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
         ┌───────────────────┐  ┌────────────────────┐
         │  Google OAuth     │  │  Google Cloud      │
         │  - User Auth      │  │  - BigQuery        │
         │  - User Info      │  │  - Vertex AI       │
         └───────────────────┘  │  - Cloud Run       │
                                 └────────────────────┘
```

## 🔧 Tech Stack

### Frontend
- **Astro** - Web framework
- **Tailwind CSS v3.4** - Styling
- **TypeScript** - Type safety

### Backend
- **Astro SSR** - Server-side rendering
- **google-auth-library** - OAuth authentication
- **jsonwebtoken** - JWT tokens

### Cloud Services
- **Google OAuth 2.0** - Authentication
- **BigQuery** - Data storage
- **Vertex AI** - AI/LLM capabilities
- **Cloud Run** - Hosting (production)

## 🔐 Security

Security best practices implemented:

- ✅ HTTPOnly cookies for session tokens
- ✅ Secure cookie flag in production
- ✅ SameSite cookie policy (CSRF protection)
- ✅ JWT token expiration (24h)
- ✅ Environment variable isolation
- ✅ Service account with minimal permissions
- ✅ Input validation and sanitization
- ✅ No sensitive data in client-side code

## 📦 Project Structure

```
salfagpt/
├── src/
│   ├── lib/
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── analytics.ts     # Analytics & RBAC
│   │   └── gcp.ts           # Google Cloud utilities
│   ├── components/
│   │   └── AnalyticsDashboard.tsx  # Analytics UI
│   ├── pages/
│   │   ├── index.astro      # Landing page
│   │   ├── home.astro       # Chat interface
│   │   ├── analytics.astro  # Analytics dashboard
│   │   ├── auth/
│   │   │   ├── login.ts     # OAuth login
│   │   │   ├── callback.ts  # OAuth callback
│   │   │   └── logout.ts    # Logout
│   │   └── api/
│   │       ├── chat.ts      # Chat API endpoint
│   │       └── analytics/   # Analytics endpoints
│   │           ├── summary.ts
│   │           ├── daily.ts
│   │           ├── tables.ts
│   │           └── table-sample.ts
│   └── styles/
│       └── global.css       # Global styles
├── docs/
│   ├── ANALYTICS_SETUP.md   # Analytics guide
│   ├── BranchLog.md         # Development log
│   └── features/            # Feature docs
├── scripts/
│   └── setup-bigquery.js    # BigQuery setup
├── Dockerfile               # Container config
├── .env.example             # Environment template
├── SETUP.md                 # Setup guide
├── OAUTH_CONFIG.md          # OAuth reference
└── README.md                # This file
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production (Google Cloud Run)
```bash
# Build and push image
npm run deploy:build

# Deploy to Cloud Run
npm run deploy:run
```

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run setup:bigquery` - Initialize BigQuery tables
- `npm run deploy:build` - Build Docker image and push to GCR
- `npm run deploy:run` - Deploy to Cloud Run

## 📝 OAuth Configuration

### Local Development
- **Authorized Origins:** `http://localhost:3000`
- **Redirect URIs:** `http://localhost:3000/auth/callback`

### Production
- **Authorized Origins:** `https://your-domain.com`
- **Redirect URIs:** `https://your-domain.com/auth/callback`

See [OAUTH_CONFIG.md](./OAUTH_CONFIG.md) for detailed instructions.

## 🐛 Troubleshooting

### OAuth `redirect_uri_mismatch`
- Check OAuth configuration matches exactly
- Wait 5-10 minutes after updating config
- Verify protocol (http vs https)

### BigQuery Permissions Error
- Verify service account has BigQuery Admin role
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Ensure BigQuery API is enabled

### Vertex AI Error
- Verify Vertex AI API is enabled
- Check service account has Vertex AI User role
- Verify location is supported

See [SETUP.md](./SETUP.md#troubleshooting) for more solutions.

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/feature-name-2025-01-09`
2. Make your changes
3. Test thoroughly
4. Create a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build/)
- Powered by [Google Cloud Platform](https://cloud.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- AI capabilities via [Vertex AI](https://cloud.google.com/vertex-ai)

---

**Need help?** Check out the [SETUP.md](./SETUP.md) and [OAUTH_CONFIG.md](./OAUTH_CONFIG.md) for detailed guides.
