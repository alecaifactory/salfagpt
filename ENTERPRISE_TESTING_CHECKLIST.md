# ✅ Enterprise Integration - Testing Checklist

**Target:** Enterprise developers integrating document processing  
**Time:** 30 minutes to complete validation  
**Outcome:** Confidence to deploy in production

---

## 🎯 Testing Path

```
Phase 1: API Playground (10 min)
   ↓
Phase 2: REST API Test (10 min)
   ↓
Phase 3: SDK Integration (10 min)
   ↓
✅ Ready for Production
```

---

## Phase 1: API Playground Testing

### Access Playground
```
URL: http://localhost:3000/api-playground
```

### Test Checklist

- [ ] **Upload PDF** (any PDF, 1-15MB)
- [ ] **Try Auto method** → Verify extraction works
- [ ] **Try Vision API** → Compare results
- [ ] **Try File API** → See if better quality
- [ ] **Switch to Pro model** → Compare quality vs Flash
- [ ] **Add webhook** → Test async notification (optional)
- [ ] **Generate API key** → Save securely
- [ ] **Export integration code** → Review generated code

### Success Criteria

✅ All methods complete without errors  
✅ Extracted text is accurate  
✅ Performance metrics make sense (time, cost)  
✅ API key generated successfully  
✅ Exported code looks correct

---

## Phase 2: REST API Testing

### Test with cURL

```bash
# 1. Set your API key
export FLOW_API_KEY="flow_api_Kx8mN2pQrS..."

# 2. Test extraction
curl -X POST http://localhost:3000/api/extract-document \
  -H "Authorization: Bearer $FLOW_API_KEY" \
  -F "file=@test-document.pdf" \
  -F "model=flash" \
  -F "extractionMethod=auto"
```

### Expected Response

```json
{
  "jobId": "job_xyz",
  "status": "completed",
  "extractedData": "Full text content...",
  "metadata": {
    "method": "file-api",
    "extractionTime": 18320,
    "cost": 0.0185,
    "tokens": { "total": 61473 }
  }
}
```

### Test Checklist

- [ ] **200 response** received
- [ ] **extractedData** contains text
- [ ] **metadata.method** shows which method was used
- [ ] **metadata.cost** is reasonable
- [ ] **Test with webhook** (if you set up endpoint)

---

## Phase 3: SDK Integration Testing

### Install SDK

```bash
# In your test project
npm install @flow/document-processor
```

### Test Code

```typescript
import { DocumentProcessor } from '@flow/document-processor';
import fs from 'fs';

async function testSDK() {
  const processor = new DocumentProcessor({
    apiKey: process.env.FLOW_API_KEY,
    baseUrl: 'http://localhost:3000', // For local testing
  });

  const buffer = fs.readFileSync('test-document.pdf');
  
  const result = await processor.extract({
    file: buffer,
    model: 'flash',
  });

  console.log('✅ Extracted:', result.text.length, 'characters');
  console.log('💰 Cost: $' + result.metadata.cost.total);
  console.log('⏱️ Time:', result.metadata.extractionTime, 'ms');
}

testSDK();
```

### Test Checklist

- [ ] **SDK installs** without errors
- [ ] **API key** authentication works
- [ ] **Extraction** completes successfully
- [ ] **Result object** matches expected interface
- [ ] **Error handling** works (try invalid file)

---

## 🏢 Production Readiness Checklist

### Security ✅

- [ ] API keys stored in environment variables (not hardcoded)
- [ ] Keys have appropriate scopes (least privilege)
- [ ] Rate limiting configured
- [ ] HTTPS enforced in production
- [ ] Webhook signature validation (if using webhooks)

### Performance ✅

- [ ] Load tested with expected volume
- [ ] Retry logic implemented
- [ ] Timeout handling configured
- [ ] Connection pooling set up
- [ ] Caching strategy defined (if applicable)

### Monitoring ✅

- [ ] Metrics collection configured (time, cost, errors)
- [ ] Alerts set up for failures
- [ ] Logging integrated with your system
- [ ] Dashboard for usage tracking
- [ ] Budget alerts configured

### Integration ✅

- [ ] Tested in staging environment
- [ ] Error handling comprehensive
- [ ] Fallback logic implemented
- [ ] Documentation for your team
- [ ] Runbook for common issues

---

## 🎓 Enterprise Developer Journey

### Week 1: Discovery

**Day 1-2: Testing**
- Access playground
- Test with real documents
- Evaluate quality and cost
- Compare with current solution

**Day 3-5: POC**
- Get API key
- Integrate in test app
- Test with production-like data
- Measure ROI

---

### Week 2: Production Prep

**Day 1-3: Integration**
- Choose integration method (API/SDK/CLI)
- Implement in staging
- Add error handling
- Configure monitoring

**Day 4-5: Deployment**
- Load test
- Security review
- Deploy to production
- Monitor closely

---

### Week 3+: Optimization

**Ongoing:**
- Monitor MCP server for updates
- Optimize based on metrics
- Scale as needed
- Provide feedback

---

## 💼 Business Validation Checklist

### Before Production Deploy

**Cost Analysis:**
- [ ] Current cost per document calculated
- [ ] Flow cost per document calculated
- [ ] Volume discount applied (if applicable)
- [ ] ROI period determined (usually <1 month)

**Performance:**
- [ ] Current processing time measured
- [ ] Flow processing time measured
- [ ] Latency improvement quantified
- [ ] User experience impact assessed

**Quality:**
- [ ] Extraction accuracy compared (sample set)
- [ ] Edge cases tested (corrupt PDFs, scans, etc)
- [ ] Failure rate measured
- [ ] Quality improvement documented

**Integration:**
- [ ] Developer time estimated (usually <8 hours)
- [ ] Maintenance overhead assessed (minimal)
- [ ] Training requirements defined (< 1 hour)
- [ ] Support channel established

---

## 📊 Success Metrics

### Track These KPIs

**Performance:**
- Avg extraction time: Target <20s
- P95 extraction time: Target <30s
- Success rate: Target >98%

**Cost:**
- Cost per document: Target <$0.02
- Monthly cost: [your budget]
- Cost savings vs current: Target >60%

**Quality:**
- Extraction accuracy: Target >95%
- User satisfaction: Target >4.5/5
- Error rate: Target <2%

**Adoption:**
- Documents processed: [track growth]
- API requests/day: [monitor]
- Active integrations: [count apps using it]

---

## 🚨 Common Issues & Solutions

### Issue 1: API Key Not Working

**Symptoms:** 401 Unauthorized

**Checks:**
```bash
# 1. Verify key format
echo $FLOW_API_KEY | grep "flow_api_"

# 2. Test key validity
curl http://localhost:3000/api/keys/verify \
  -H "Authorization: Bearer $FLOW_API_KEY"
```

**Fix:** Regenerate key in playground

---

### Issue 2: Extraction Timeout

**Symptoms:** Request takes >60s

**Checks:**
- File size (<20MB recommended)
- Network stability
- Gemini API status

**Fix:**
- Use chunked method for very large files
- Increase timeout in your client
- Use webhook for async (don't wait)

---

### Issue 3: Poor Quality Results

**Symptoms:** Missing text, garbled output

**Checks:**
- PDF is valid (not password-protected)
- Correct method selected (auto usually best)
- Model appropriate (Pro for complex)

**Fix:**
- Try different method
- Use Pro model
- Contact support with sample

---

## 📞 Enterprise Support

### Getting Help

**Community (Free):**
- Discord: https://discord.gg/flow-ai
- GitHub Issues: [Report bugs]
- Documentation: [Search guides]

**Professional ($99/mo):**
- Email: support@getaifactory.com
- Response time: <24h
- Integration help: 2h/month included

**Enterprise (Custom):**
- Dedicated Slack channel
- Priority support: <4h response
- Custom SLA: 99.9% uptime
- White-glove onboarding

---

## ✅ Final Checklist

Before going live:

- [ ] All tests passed (Phases 1-3)
- [ ] API key secured in secrets manager
- [ ] Monitoring configured
- [ ] Team trained on integration
- [ ] Runbook created for incidents
- [ ] Budget alerts configured
- [ ] Backup extraction method defined
- [ ] Production deployment approved

---

**When all checkboxes are ✅, you're ready for production!** 🎉

**Questions? support@getaifactory.com** 📧  
**Need demo? sales@getaifactory.com** 📞

---

**Welcome to enterprise-grade document processing.** 🚀
