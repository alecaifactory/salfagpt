# 🚀 Flow Deployment System

**Multi-environment deployment with 95% automation**

---

## 📁 Files in This Directory

### Automated Scripts
- **`setup-client-project.sh`** - Complete GCP project setup (15 min, 95% automated)
- **`deploy-to-environment.sh`** - Universal deployment script (3-5 min)
- **`create-secrets.sh`** - Secret creation helper (2 min)
- **`verify-environment.sh`** - Health check any environment (30 sec)
- **`rollback-deployment.sh`** - Emergency rollback (2 min)

### Environment Templates
- **`env-templates/staging-internal.env`** - Your staging config template
- **`env-templates/staging-client.env`** - Client staging template
- **`env-templates/production-client.env`** - Client production template

### Documentation
- **`MULTI_ENVIRONMENT_SETUP_GUIDE.md`** - Complete setup guide
- **`MANUAL_CONFIGURATION_CHECKLIST.md`** - What you configure manually
- **`README.md`** - This file

---

## 🎯 Quick Start

### Setup New Client (First Time)

```bash
# 1. Get client project IDs
CLIENT_STAGING="acme-flow-staging-12345"
CLIENT_PRODUCTION="acme-flow-production-67890"

# 2. Setup staging (15 min automated)
./setup-client-project.sh
# → Type: staging
# → Enter: acme-flow-staging-12345

# 3. Manual config (10 min)
# - Create 3 secrets
# - Configure OAuth
# See: MANUAL_CONFIGURATION_CHECKLIST.md

# 4. Deploy staging (3 min)
./deploy-to-environment.sh staging-client

# 5. Setup production (same as staging)
./setup-client-project.sh
# → Type: production
# → Enter: acme-flow-production-67890

# 6. Deploy production (3 min + confirmation)
./deploy-to-environment.sh production-client
```

**Total**: ~45-60 minutes per client

---

## 🌍 Environments

| Environment | Script Parameter | GCP Project | Purpose |
|------------|------------------|-------------|---------|
| Local | - | gen-lang-client-0986191192 | Development |
| Staging Internal | `staging-internal` | gen-lang-client-0986191192 | Internal QA |
| Client Staging | `staging-client` | CLIENT-STAGING-PROJECT | Client UAT |
| Client Production | `production-client` | CLIENT-PRODUCTION-PROJECT | Live service |

---

## 🛡️ Safety Features

### Cursor Protection Rules

When you run deployments, Cursor AI will:

**For Staging**:
- Show environment info
- Display pre-checks
- Ask: "Proceed? (yes/no)"

**For Production**:
- Show complete checklist
- Display rollback plan
- Require: "Type 'DEPLOY' to proceed"

**Protection rules** (require confirmation):
- `.cursor/rules/environment-awareness.mdc`
- `.cursor/rules/staging-deployment-protection.mdc`
- `.cursor/rules/production-deployment-protection.mdc`

---

## 📚 Documentation

**Start here**:
1. `MULTI_ENVIRONMENT_SETUP_GUIDE.md` - Complete setup process
2. `MANUAL_CONFIGURATION_CHECKLIST.md` - What you configure manually

**Reference**:
- `../config/environments.ts` - Environment definitions
- `../ENV_VARIABLES_REFERENCE.md` - Environment variables
- `../.cursor/rules/environment-awareness.mdc` - Protection rules

---

## 🔧 Common Commands

### Deploy to Environment

```bash
./deploy-to-environment.sh [environment]
```

### Verify Health

```bash
./verify-environment.sh [environment]
```

### Rollback

```bash
./rollback-deployment.sh [environment] [revision-name]
```

### Create Secrets

```bash
./create-secrets.sh [environment]
```

---

## ✅ Success Metrics

**Per client setup**:
- ⏱️ Time: ~45-60 minutes
- 🤖 Automation: 95%
- 🔐 Security: Multi-layer
- 📊 Isolation: Complete

**Ongoing deployments**:
- ⏱️ Staging: ~3-5 minutes
- ⏱️ Production: ~3-5 minutes + approval
- 🛡️ Protection: Cursor confirmation required
- 🔄 Rollback: < 2 minutes if needed

---

## 🆘 Need Help?

1. **Setup issues**: See `MULTI_ENVIRONMENT_SETUP_GUIDE.md`
2. **Manual config**: See `MANUAL_CONFIGURATION_CHECKLIST.md`
3. **Deployment errors**: Check script output and logs
4. **OAuth issues**: Verify redirect URIs match deployed URL

---

**Happy Deploying! 🚀**

