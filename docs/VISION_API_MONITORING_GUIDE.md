# 📊 Google Cloud Vision API - Monitoring Guide

## 🎯 Purpose

This guide shows you where and how to monitor Vision API processing in real-time using Google Cloud Console.

---

## 🌐 **GCP Console Monitoring Locations**

### **1. Cloud Logging (Real-time Logs)** ⭐ **BEST FOR REAL-TIME**

**URL:** https://console.cloud.google.com/logs/query?project=salfagpt

**Filter for Vision API calls:**
```
resource.type="cloud_run_revision"
jsonPayload.message=~"Vision API"
OR textPayload=~"Vision API"
OR protoPayload.serviceName="vision.googleapis.com"
```

**What you'll see:**
```
15:05:23 👁️ GOOGLE CLOUD VISION API - PDF EXTRACTION
15:05:23 📄 PDF size: 1.13 MB
15:05:23 🌍 Project: salfagpt
15:05:23 🔄 Step 1/3: Encoding PDF to base64...
15:05:23 ✅ Encoded in 45ms
15:05:23 🔄 Step 2/3: Calling Vision API...
15:05:25 ✅ Vision API responded in 2150ms
15:05:25 🔄 Step 3/3: Processing response...
15:05:25 ✅ VISION API EXTRACTION SUCCESSFUL
15:05:25 📊 Results:
15:05:25    Characters: 245,832
15:05:25    Words: 12,543
15:05:25    Pages: 16
15:05:25    Confidence: 98.7%
15:05:25    Language: es
15:05:25 ⏱️  Total time: 2.35s
15:05:25 💰 Est. cost: $0.0240
```

---

### **2. Vision API Dashboard** (Metrics & Usage)

**URL:** https://console.cloud.google.com/apis/api/vision.googleapis.com/metrics?project=salfagpt

**Metrics Available:**
- Request count (per minute/hour/day)
- Request latency (p50, p95, p99)
- Error rate
- Quota usage

**Charts:**
- API calls over time
- Success vs failure rate
- Average response time
- Cost estimation

---

### **3. Cloud Trace** (Performance Analysis)

**URL:** https://console.cloud.google.com/traces/list?project=salfagpt

**Filter:**
```
Service: vision.googleapis.com
Method: ImageAnnotator.DocumentTextDetection
```

**Shows:**
- Individual request traces
- Latency breakdown
- Network time vs processing time
- Bottleneck identification

---

### **4. Error Reporting**

**URL:** https://console.cloud.google.com/errors?project=salfagpt

**Filter for Vision API errors:**
```
service.name="vision.googleapis.com"
```

**Common errors you might see:**
- `QUOTA_EXCEEDED` - Need to increase quota
- `INVALID_ARGUMENT` - Wrong image format
- `PERMISSION_DENIED` - IAM permissions issue
- `DEADLINE_EXCEEDED` - Request timeout

---

### **5. Billing** (Cost Tracking)

**URL:** https://console.cloud.google.com/billing/linkedaccount?project=salfagpt

**Vision API Pricing:**
- Document Text Detection: **$1.50 per 1,000 pages**
- For SSOMA (16 pages): **$0.024 per document**

**Monitor:**
- Daily Vision API spend
- Requests per day
- Average cost per request

---

## 🔍 **Real-Time Monitoring During Upload**

### **Step-by-Step:**

1. **Open Cloud Logging** (before upload):
   ```
   https://console.cloud.google.com/logs/query?project=salfagpt
   ```

2. **Set filter:**
   ```
   resource.type="cloud_run_revision"
   textPayload=~"Vision API"
   severity>=DEFAULT
   ```

3. **Enable streaming:**
   - Click "Stream logs" button (top right)
   - Logs will update in real-time

4. **Upload SSOMA-P-004** in your app

5. **Watch logs appear:**
   ```
   👁️ GOOGLE CLOUD VISION API - PDF EXTRACTION
   📄 PDF size: 1.13 MB
   🔄 Step 1/3: Encoding...
   ✅ Encoded in 45ms
   🔄 Step 2/3: Calling Vision API...
   (Wait ~2-3 seconds for API)
   ✅ Vision API responded in 2150ms
   ✅ VISION API EXTRACTION SUCCESSFUL
   📊 Characters: 245,832
      Words: 12,543 ← Should be thousands, not hundreds!
   ```

---

## 📱 **Frontend Console Logs**

### **Browser Console (F12) will show:**

```javascript
📤 Uploading file: SSOMA-P-004.pdf (1.13 MB) with Vision API
   
// Then server logs (proxied to frontend):
👁️ GOOGLE CLOUD VISION API - PDF EXTRACTION
📄 PDF size: 1.13 MB
🌍 Project: salfagpt
⏱️  Started: 3:05:23 PM

🔄 Step 1/3: Encoding PDF to base64...
✅ Encoded in 45ms

🔄 Step 2/3: Calling Vision API...
   Endpoint: Cloud Vision Document Text Detection
   Language hints: Spanish (es), English (en)
✅ Vision API responded in 2150ms

🔄 Step 3/3: Processing response...
┌─────────────────────────────────────────────────┐
│ ✅ VISION API EXTRACTION SUCCESSFUL             │
└─────────────────────────────────────────────────┘
📊 Results:
   Characters: 245,832
   Words: 12,543 ← VALIDATE THIS!
   Pages: 16
   Confidence: 98.7%
   Language: es
⏱️  Total time: 2.35s
💰 Est. cost: $0.0240
```

---

## ✅ **Validation Checklist**

After Vision API extraction, verify:

- [ ] **Characters:** >200,000 (SSOMA is ~245K)
- [ ] **Words:** >10,000 (should be thousands, not hundreds)
- [ ] **Confidence:** >95%
- [ ] **Contains key phrases:**
  - [ ] "riesgo más grave"
  - [ ] "Riesgos Críticos Operacionales"
  - [ ] "Manual de Estándares SSOMA"

---

## 🚨 **Troubleshooting**

### **Error: PERMISSION_DENIED**

```bash
# Grant Vision API permissions
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:SERVICE_ACCOUNT" \
  --role="roles/cloudvision.admin"
```

### **Error: API not enabled**

```bash
# Enable Vision API
gcloud services enable vision.googleapis.com --project=salfagpt
```

### **Low word count (similar to Gemini issue)**

Check in GCP Logs if Vision API actually responded or if there's a fallback happening.

---

## 📈 **Performance Comparison**

| Method | Time | Cost | Quality (SSOMA) |
|--------|------|------|-----------------|
| **Gemini Flash** | ~87s | $0.28 | ❌ Incomplete (112 words) |
| **Gemini Pro** | ~120s | $1.20 | ⚠️ Unknown (not tested) |
| **Vision API** | ~2-4s | $0.024 | ✅ Expected: Complete |

---

## 🔗 **Quick Links**

### **Main Consoles:**
- **Logs:** https://console.cloud.google.com/logs?project=salfagpt
- **Vision API:** https://console.cloud.google.com/apis/api/vision.googleapis.com?project=salfagpt
- **Metrics:** https://console.cloud.google.com/monitoring?project=salfagpt
- **Billing:** https://console.cloud.google.com/billing?project=salfagpt

### **Enable Vision API:**
```bash
gcloud services enable vision.googleapis.com --project=salfagpt
```

### **Test Vision API:**
```bash
# Quick test
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://vision.googleapis.com/v1/images:annotate
```

---

## 📝 **Expected Flow**

```
User uploads PDF
    ↓
Frontend: "📤 Uploading with Vision API"
    ↓
Backend: 
  👁️ GOOGLE CLOUD VISION API - PDF EXTRACTION
  🔄 Step 1/3: Encoding...
  ✅ Encoded
  🔄 Step 2/3: Calling Vision API...
  ✅ Vision API responded
  🔄 Step 3/3: Processing...
  ✅ EXTRACTION SUCCESSFUL
  📊 Characters: 245K, Words: 12K
    ↓
GCP Logs (real-time):
  Shows same logs + Vision API internal metrics
    ↓
Chunking & Embedding
    ↓
Ready for search ✅
```

---

**Created:** 2025-10-24  
**Purpose:** Monitor Vision API extraction in real-time  
**Project:** salfagpt

