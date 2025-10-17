# 📋 What I Need From You

**To deploy Flow to a new client, I need this information:**

---

## 🎯 Per Client Deployment

### 1. GCP Project IDs (Required)

**Two GCP projects per client**:

```bash
# Staging
CLIENT_STAGING_PROJECT_ID="acme-flow-staging-12345"

# Production  
CLIENT_PRODUCTION_PROJECT_ID="acme-flow-production-67890"
```

**Options**:
- **A)** Client creates projects and provides IDs
- **B)** I create projects for client (need billing account)

**If client creates**: They must grant you **Owner** role  
**If you create**: You need their **billing account ID**

---

### 2. Gemini API Key (Required)

```bash
GEMINI_API_KEY="AIzaSy..."
```

**Options**:
- **A)** Use your existing key (simplest)
- **B)** Client provides their key

**Get from**: https://aistudio.google.com/app/apikey

---

### 3. Custom Domains (Optional)

If client wants professional URLs:

```bash
# Staging
STAGING_DOMAIN="staging.acme.com"

# Production
PRODUCTION_DOMAIN="flow.acme.com"
```

**If yes**, you also need:
- [ ] DNS provider access (to add CNAME records)
- [ ] Or client can add DNS records (I'll provide values)

---

### 4. Branding (Optional but Recommended)

For OAuth consent screen:

```
Company Name: "Acme Corporation"
Support Email: "support@acme.com"
App Logo: [URL or file]
Privacy Policy: "https://acme.com/privacy"
Terms of Service: "https://acme.com/terms"
```

**Used for**: OAuth consent screen when users log in

---

## 📝 Information Template

**Copy this and fill it out**:

```markdown
## Client: [CLIENT_NAME]

### GCP Projects
- Staging Project ID: [PROJECT-ID]
- Production Project ID: [PROJECT-ID]
- Billing Account: [ACCOUNT-ID] (if you're creating projects)
- Your Access: Owner role granted? [Yes/No]

### API Keys
- Gemini API Key: [Use yours / Client provides]
  - If client provides: [CLIENT_GEMINI_KEY]

### Custom Domains
- Staging Domain: [domain.com] or [None]
- Production Domain: [domain.com] or [None]
- DNS Access: [Yes / No / Client will add records]

### Branding
- Company Name: [CLIENT_COMPANY_NAME]
- Support Email: [support@client.com]
- App Logo: [URL or None]
- Privacy Policy: [URL or None]
- Terms of Service: [URL or None]

### Timeline
- Staging Deploy: [DATE]
- Production Deploy: [DATE]
- Go-Live: [DATE]
```

---

## ⏱️ What Happens Next

**Once you provide the above**, I will:

### Automated (30 min)
1. ✅ Run setup scripts for staging
2. ✅ Run setup scripts for production
3. ✅ Enable all APIs
4. ✅ Create Firestore databases
5. ✅ Create service accounts
6. ✅ Set up permissions
7. ✅ Create storage buckets

### Manual (25 min)
1. ✅ Create 3 secrets per environment (8 min)
2. ✅ Configure 2 OAuth clients (20 min)
3. ✅ Create 2 .env files (4 min)

### Deploy (15 min)
1. ✅ Deploy to staging (5 min)
2. ✅ Update OAuth URIs (2 min)
3. ✅ Wait for propagation (10 min)
4. ✅ Deploy to production (5 min)
5. ✅ Update OAuth URIs (2 min)
6. ✅ Test both environments (5 min)

**Total**: ~70 minutes (first client)  
**Subsequent**: ~45 minutes (faster with experience)

---

## 🎯 Minimum Required Info

**Absolute minimum to get started**:

```
1. Staging Project ID: _______________________
2. Production Project ID: _____________________
3. Use your Gemini key? [Yes/No]
4. Custom domains needed? [Yes/No]
```

**That's it!** Everything else has sensible defaults or can be configured later.

---

## 💡 Recommended Info

**For best results, also provide**:

```
5. Client company name: _______________________
6. Client support email: ______________________
7. Staging domain: ____________________________
8. Production domain: _________________________
9. Target go-live date: _______________________
```

---

## 📞 How to Provide This

**Send me**:

1. **Quick version**: Just the 4 minimum items
2. **Complete version**: Fill out the full template above
3. **Via**: Chat message, doc, email - whatever works

**I'll then**:
1. Run setup scripts
2. Guide you through manual steps
3. Deploy both environments
4. Verify everything works
5. Hand off to client

---

## 🔄 Example

**Client**: Acme Corp

**You provide**:
```
1. Staging: acme-flow-staging-12345
2. Production: acme-flow-production-67890
3. Use your Gemini key: Yes
4. Custom domains: Yes
   - Staging: staging.acme.com
   - Production: flow.acme.com
5. Company: Acme Corporation
6. Support: support@acme.com
```

**I execute** (45-60 min):
- Setup both GCP projects
- Create secrets
- Configure OAuth
- Deploy both environments
- Configure custom domains

**Client gets**:
- ✅ https://staging.acme.com (UAT)
- ✅ https://flow.acme.com (Production)
- ✅ Branded OAuth login
- ✅ Complete isolation
- ✅ Ready to go live

---

**Provide the info whenever you have a client ready!** 🚀

**Template above** ⬆️ or just the 4 minimum items.
