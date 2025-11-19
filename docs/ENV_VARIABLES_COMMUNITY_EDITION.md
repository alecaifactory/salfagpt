# Environment Variables: Community Edition

Add these to your `.env` file for Community Edition monetization features.

## 🔐 **Stripe Payment Integration**

```bash
# Stripe API Keys
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret
# Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
# Create products in Stripe Dashboard first, then add price IDs here
STRIPE_PRICE_MONTHLY_USD=price_1234567890abcdef
STRIPE_PRICE_ANNUAL_USD=price_0987654321fedcba
STRIPE_PRICE_MONTHLY_CLP=price_abcdef1234567890
```

## 📧 **Email Configuration**

```bash
# SendGrid (recommended) or Postmark
SENDGRID_API_KEY=SG.1234567890abcdef...
EMAIL_FROM=support@latamlab.ai
EMAIL_REPLY_TO=hello@latamlab.ai
```

## 💰 **Subscription Settings**

```bash
# Trial period
TRIAL_DAYS=14

# Pricing (USD)
MONTHLY_PRICE_USD=20
ANNUAL_PRICE_USD=200

# Pricing (Chilean Pesos)
MONTHLY_PRICE_CLP=18000
ANNUAL_PRICE_CLP=180000

# Features
PRIORITY_TICKETS_PER_MONTH=5
MONTHLY_TOKEN_LIMIT=10000000
STORAGE_LIMIT_GB=10
```

## 🌍 **MercadoPago (Optional - LATAM)**

```bash
# For users in Argentina, Brazil, Chile, Colombia, Mexico, Peru
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-...
```

## ✅ **Complete Example**

Full `.env` file with all Community Edition variables:

```bash
# GCP
GOOGLE_CLOUD_PROJECT=salfagpt
ENVIRONMENT_NAME=localhost

# AI
GOOGLE_AI_API_KEY=AIzaSy...

# OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Auth
JWT_SECRET=your-secure-secret-here

# App
PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_USD=price_...
STRIPE_PRICE_ANNUAL_USD=price_...

# Email
SENDGRID_API_KEY=SG....
EMAIL_FROM=support@latamlab.ai

# Subscription
TRIAL_DAYS=14
MONTHLY_PRICE_USD=20
PRIORITY_TICKETS_PER_MONTH=5
```

