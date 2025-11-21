# How to Test the Fixed Nubox Extraction

## 🎯 Quick Start

The fix has been deployed with **rollback capability**. Here's how to test it.

---

## 🧪 Option 1: Test via API Playground (Recommended)

### Steps:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the API Playground:**
   ```
   http://localhost:3000/api-playground-simple
   ```

3. **Upload a test file:**
   - Navigate to `/Users/alec/salfagpt/upload-queue/cartolas/`
   - Start with `Banco de Chile.pdf`
   - Select `gemini-2.5-flash` model
   - Enable "Nubox Format" if available

4. **Verify the output:**
   - Check that amounts have decimals: `14994.50` not `1499450`
   - Verify `holder_id` includes DV: `"77352453k"` not `"77352453"`
   - Confirm `currency` is `"CLP"` or `null`, not `"0"`
   - Review the `insights` field structure

---

## 🧪 Option 2: Direct API Test

### Via cURL:

```bash
curl -X POST http://localhost:3000/api/playground/extract \
  -F "file=@/Users/alec/salfagpt/upload-queue/cartolas/Banco de Chile.pdf" \
  -F "model=gemini-2.5-flash" \
  -F "structured=true" \
  -F "outputFormat=nubox" \
  | jq '.result.movements[0]'
```

### Expected Output:
```json
{
  "id": "mov_...",
  "type": "transfer",
  "amount": 14994.5,          // ✅ Decimal present
  "pending": false,
  "currency": "CLP",          // ✅ Not "0"
  "post_date": "2024-04-24T00:00:00Z",
  "description": "77.352.453-K Transf. FERRETERI",
  "sender_account": {
    "holder_id": "77352453k", // ✅ DV included
    "dv": "k",
    "holder_name": null
  },
  "insights": {
    "errores": [],
    "calidad": "alta",
    "banco": "Banco de Chile",
    "extraction_proximity_pct": 95  // ✅ New key name
  }
}
```

---

## 🧪 Option 3: Unit Test

### Test the Amount Parser:

```bash
node scripts/test-amount-parsing.js
```

**Expected output:**
```
Current Implementation:  6 errors out of 10 tests (60.0% failure rate)
Improved Implementation: 0 errors out of 10 tests (0.0% failure rate)

✅ SUCCESS: Improved implementation handles all test cases correctly!
```

---

## ✅ What to Verify

### Critical Fields:

| Field | Old Behavior | New Behavior | How to Check |
|-------|--------------|--------------|--------------|
| `amount` | `1499450` (wrong) | `14994.5` (correct) | Look for decimals |
| `holder_id` | `"77352453"` | `"77352453k"` | Check DV presence |
| `currency` | `"0"` | `null` or `"CLP"` | Check type |
| `insights` key | `'cercania % de extraccion'` | `extraction_proximity_pct` | Check key name |

### Quality Checks:

1. **Amounts Match PDF:**
   - Open the original PDF
   - Compare amounts in JSON with PDF
   - Decimals should be preserved

2. **RUT Format:**
   - All `holder_id` should include DV
   - Format: `"12345678k"` (lowercase DV)

3. **Currency:**
   - CLP documents: `"CLP"`
   - Other/unknown: `null`
   - Never: `"0"` (string)

4. **Insights:**
   - Must be present in every movement
   - Keys: `errores`, `calidad`, `banco`, `extraction_proximity_pct`

---

## 🔄 If Something Goes Wrong

### Rollback Steps:

```bash
# Easy rollback:
bash scripts/rollback-nubox-extraction.sh

# Or manually:
cp src/lib/nubox-cartola-extraction.backup-20251118-145405.ts \
   src/lib/nubox-cartola-extraction.ts

# Restart server:
npm run dev
```

---

## 📋 Test All Banks (Comprehensive)

Test with all 7 available cartolas:

```bash
cd /Users/alec/salfagpt/upload-queue/cartolas/

# Test each bank:
1. Banco de Chile.pdf                    ← Start here
2. Banco del Estado de Chile.pdf
3. Banco Itaú Chile.pdf
4. Banco Scotiabank (Correo).pdf
5. Banco Scotiabank (descarga web).pdf
6. MachBank.pdf
7. TenpoBank.pdf
```

**For each bank, verify:**
- [ ] Extraction completes without errors
- [ ] Amounts have correct decimals
- [ ] RUTs include DV
- [ ] Currency is CLP or null (not "0")
- [ ] All movements have insights field

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Rebuild the project
```bash
npm run build
npm run dev
```

### Issue: "result is not defined"
**Solution:** The new version has better error handling. Check logs:
```bash
# Look for errors in console
tail -f logs/server.log
```

### Issue: "Amount still wrong"
**Solution:** Clear cache and hard refresh
```bash
# In browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Issue: "API key not configured"
**Solution:** Check environment variables
```bash
echo $GOOGLE_AI_API_KEY
# Should not be empty
```

---

## 📊 Success Criteria

✅ **Test Passed If:**
- No errors during extraction
- Amounts match PDF exactly
- Decimals are preserved (e.g., `14994.50` not `1499450`)
- RUTs include DV: `"77352453k"`
- Currency is `"CLP"` or `null` (never `"0"`)
- Insights field present in all movements
- Quality score > 90%

❌ **Test Failed If:**
- Extraction throws errors
- Amounts are incorrect
- Decimals missing or wrong
- RUTs malformed
- Currency is string `"0"`
- Missing insights field

---

## 📞 Need Help?

If you encounter issues:

1. **Check the logs:**
   - Browser console (F12)
   - Server console (where `npm run dev` is running)

2. **Review documentation:**
   - `DEPLOYMENT_LOG.md` - What was changed
   - `TEST_RESULTS_COMPARISON.md` - Expected results
   - `docs/CODE_COMPARISON_SIDE_BY_SIDE.md` - Code examples

3. **Rollback if needed:**
   - Run: `bash scripts/rollback-nubox-extraction.sh`
   - Document what went wrong
   - Test the old version to confirm it works

---

## 🎉 After Successful Testing

Once you've verified the fix works:

1. **Document test results:**
   - Note which banks were tested
   - Record any anomalies
   - Save sample output

2. **Deploy to production** (if applicable)

3. **Update API documentation**

4. **Notify consumers** (if any systems depend on this API)

---

## 📝 Test Checklist

- [ ] Server starts without errors
- [ ] Can access API playground
- [ ] File upload works
- [ ] Extraction completes (Banco de Chile)
- [ ] Amounts are correct (with decimals)
- [ ] RUTs include DV
- [ ] Currency is CLP/null (not "0")
- [ ] Insights field present
- [ ] Test 2-3 more banks
- [ ] No linter errors
- [ ] Performance acceptable
- [ ] Rollback script tested

---

**Happy Testing! 🚀**

If all tests pass, the critical bug is fixed and the system is production-ready.


