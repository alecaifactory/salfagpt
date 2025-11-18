# M001 Document Sources - Official URLs

## 🌐 Official Government URLs for M001 Documents

Based on Chilean government structure and standard URLs for public regulatory documents.

---

## 📚 Document Sources by Category

### **1. DDUs (Dictámenes de Dirección de Obras Urbanas)**

**Official Source:** MINVU - Ministerio de Vivienda y Urbanismo

**Primary URL:**
```
https://www.minvu.gob.cl/elementos-tecnicos/ddu/
```

**Example DDU Document:**
```
https://www.minvu.gob.cl/wp-content/uploads/2019/04/DDU-493.pdf
```
(Note: Exact URL structure may vary, MINVU reorganizes their site periodically)

**Search/Index Page:**
```
https://www.minvu.gob.cl/elementos-tecnicos/
```

**How to find specific DDUs:**
1. Navigate to: https://www.minvu.gob.cl
2. Go to: "Elementos Técnicos" → "DDU"
3. Search by number (e.g., DDU-493)
4. Download PDF

**Alternative Access:**
- Some DDUs are compiled in indices (e.g., "INDICE-HASTA-LA-DDU-ESP-08-de-2015")
- MINVU publishes consolidated documents periodically

---

### **2. CIRs (Circulares)**

**Official Source:** MINVU - Ministerio de Vivienda y Urbanismo

**Primary URLs:**
```
https://www.minvu.gob.cl/elementos-tecnicos/circulares/

https://www.minvu.gob.cl/normativa-ddu-y-circulares/
```

**Example CIR Documents:**
```
CIR-182: https://www.minvu.gob.cl/wp-content/uploads/[year]/[month]/CIR-182.pdf

CIR-231: https://www.minvu.gob.cl/wp-content/uploads/[year]/[month]/CIR-231.pdf

CIR-232: https://www.minvu.gob.cl/wp-content/uploads/[year]/[month]/CIR-232.pdf
```

**Search Method:**
1. Go to: https://www.minvu.gob.cl
2. Navigate to: "Normativa" or "Elementos Técnicos"
3. Select "Circulares"
4. Browse or search by number

---

### **3. OGUC (Ordenanza General de Urbanismo y Construcciones)**

**Official Source:** BCN - Biblioteca del Congreso Nacional de Chile

**Primary URL (Full Law Text):**
```
https://www.bcn.cl/leychile/navegar?idNorma=13560
```

**Alternative URL (MINVU Version with Commentary):**
```
https://www.minvu.gob.cl/oguc/

https://www.minvu.gob.cl/wp-content/uploads/2021/02/OGUC_ACTUALIZADA_2021.pdf
```

**Official Legal Database:**
```
https://www.bcn.cl/leychile/
```
(Search for: "Ordenanza General de Urbanismo y Construcciones" or "OGUC")

**Decreto Supremo N° 47 de 1992:**
```
https://www.bcn.cl/leychile/navegar?idNorma=13560&idParte=8718044
```

---

### **4. Congressional Projects (Proyectos de Ley)**

**Official Source:** Congreso Nacional de Chile

**Primary URL:**
```
https://www.congreso.cl/pley/
```

**Search Projects:**
```
https://www.congreso.cl/pley/pley_buscador.aspx
```

**Example Project:**
```
https://www.congreso.cl/pley/pley_detalle.aspx?prmID=[project_number]
```

**Alternative:**
```
https://www.camara.cl/legislacion/proyectos.aspx

https://www.senado.cl/appsenado/templates/tramitacion/index.php
```

---

### **5. Jurisprudence (Court Rulings)**

**Official Source:** Poder Judicial de Chile

**Primary URL:**
```
https://oficinajudicialvirtual.pjud.cl/
```

**Supreme Court Rulings:**
```
https://suprema.pjud.cl/
```

**Legal Search:**
```
https://oficinajudicialvirtual.pjud.cl/indexN.php?m=jurisprudencia
```

**Alternative (CAPJ - Centro de Análisis de Jurisprudencia):**
```
https://www.pjud.cl/centro-de-analisis-de-jurisprudencia
```

---

## 🤖 Scraping Strategy for Calendar System

### **Configuration for Each Source:**

#### **Source 1: MINVU DDUs**
```typescript
{
  title: "MINVU DDU Documents - Monthly",
  sourceType: "web",
  sourceUrl: "https://www.minvu.gob.cl/elementos-tecnicos/ddu/",
  schedule: {
    type: "recurring",
    recurrence: "monthly", // DDUs published periodically
    dayOfMonth: 1,
    time: "06:00"
  },
  scraperSettings: {
    waitForSelector: ".entry-content",
    downloadPDFs: true,
    followLinks: {
      selector: "a[href*='.pdf']",
      maxDepth: 2
    }
  }
}
```

#### **Source 2: MINVU Circulares**
```typescript
{
  title: "MINVU CIR Circulares - Monthly",
  sourceType: "web",
  sourceUrl: "https://www.minvu.gob.cl/elementos-tecnicos/circulares/",
  schedule: {
    type: "recurring",
    recurrence: "monthly",
    dayOfMonth: 1,
    time: "07:00"
  },
  scraperSettings: {
    downloadPDFs: true,
    followLinks: {
      selector: "a[href*='CIR']",
      maxDepth: 2
    }
  }
}
```

#### **Source 3: OGUC Updates**
```typescript
{
  title: "OGUC Updates - Quarterly",
  sourceType: "web",
  sourceUrl: "https://www.bcn.cl/leychile/navegar?idNorma=13560",
  schedule: {
    type: "recurring",
    recurrence: "monthly",
    dayOfMonth: 1,
    time: "08:00"
  },
  scraperSettings: {
    waitForSelector: ".contenido-ley",
    extractSelector: "#contenido-ley",
  }
}
```

#### **Source 4: Congressional Projects**
```typescript
{
  title: "Congressional Urban Development Projects - Daily",
  sourceType: "web",
  sourceUrl: "https://www.congreso.cl/pley/pley_buscador.aspx",
  schedule: {
    type: "recurring",
    recurrence: "daily",
    time: "06:00"
  },
  scraperSettings: {
    waitForSelector: ".resultado-busqueda",
    extractSelector: ".proyecto-detalle",
    // Add search parameters for urban development topics
  }
}
```

#### **Source 5: Court Rulings**
```typescript
{
  title: "Urban Development Jurisprudence - Weekly",
  sourceType: "web",
  sourceUrl: "https://oficinajudicialvirtual.pjud.cl/indexN.php?m=jurisprudencia",
  schedule: {
    type: "recurring",
    recurrence: "weekly",
    dayOfWeek: "monday",
    time: "09:00"
  },
  scraperSettings: {
    waitForSelector: ".sentencia",
    // Add filters for urban development cases
  }
}
```

---

## 🔍 How to Find Specific Documents

### **Method 1: Direct Search on MINVU**

1. Go to: https://www.minvu.gob.cl
2. Use search box (top right)
3. Enter: "DDU-493" or "CIR-182"
4. Click result → Download PDF

### **Method 2: Google Search**

```
site:minvu.gob.cl "DDU-493" filetype:pdf

site:minvu.gob.cl "CIR-182" filetype:pdf

site:bcn.cl "OGUC" filetype:pdf
```

### **Method 3: BCN Legal Database**

1. Go to: https://www.bcn.cl/leychile/
2. Search: "Ordenanza General Urbanismo"
3. Browse related documents
4. Download/view official text

---

## 📝 Document URL Patterns

### **MINVU PDFs (Common Patterns):**

```
Pattern 1: https://www.minvu.gob.cl/wp-content/uploads/YYYY/MM/DDU-XXX.pdf
Pattern 2: https://www.minvu.gob.cl/wp-content/uploads/YYYY/MM/CIR-XXX.pdf
Pattern 3: https://www.minvu.gob.cl/elementos-tecnicos/[category]/[document].pdf
```

**Examples:**
```
https://www.minvu.gob.cl/wp-content/uploads/2019/04/DDU-493.pdf
https://www.minvu.gob.cl/wp-content/uploads/2018/06/CIR-182.pdf
https://www.minvu.gob.cl/wp-content/uploads/2021/02/OGUC_ACTUALIZADA_2021.pdf
```

### **BCN Legal Documents:**

```
Pattern: https://www.bcn.cl/leychile/navegar?idNorma=[ID]
```

**Example:**
```
https://www.bcn.cl/leychile/navegar?idNorma=13560 (OGUC)
https://www.bcn.cl/leychile/navegar?idNorma=242302 (Ley General de Urbanismo)
```

### **Congressional Projects:**

```
Pattern: https://www.congreso.cl/pley/pley_detalle.aspx?prmID=[ID]
```

---

## ⚠️ Important Notes

### **URL Stability:**

- **MINVU URLs change periodically** when they redesign their site
- **BCN URLs are stable** (legal database maintained consistently)
- **Congreso URLs are stable** (official legislative tracking)
- **Court URLs may change** with system updates

### **Scraping Recommendations:**

1. **Use multiple URL patterns** as fallbacks
2. **Check robots.txt** before scraping:
   - https://www.minvu.gob.cl/robots.txt
   - https://www.bcn.cl/robots.txt
   - https://www.congreso.cl/robots.txt

3. **Respect rate limits:**
   - MINVU: 1 request per 2 seconds
   - BCN: 1 request per 3 seconds
   - Congreso: 1 request per 5 seconds

4. **User-Agent identification:**
   ```
   User-Agent: FlowDataBot/1.0 (+https://yoursite.com/bot-info)
   ```

5. **Cache documents** - Don't re-download unchanged files

---

## 🚀 Automated Monitoring Strategy

### **Setup Calendar Events:**

**Monthly Check (All Sources):**
- Day 1 of each month
- Check for new DDUs, CIRs, OGUC updates
- Download new documents
- Process & vectorize
- Update agents
- Publish to marketplace

**Weekly Check (High Priority):**
- Every Monday
- Congressional projects
- Court rulings
- Breaking regulatory changes

**Daily Check (Critical):**
- Emergency regulations
- Breaking news
- Important project updates

---

## 📊 Expected Document Volume

### **New Documents per Month:**

- **DDUs:** 2-5 new per month
- **CIRs:** 3-8 new per month
- **OGUC Updates:** 1-2 per quarter
- **Congressional Projects:** 10-20 relevant per month
- **Court Rulings:** 5-15 relevant per month

**Total:** ~30-50 new documents/month

**Processing Cost:** ~$15-25/month (Gemini + BigQuery)

---

## ✅ Verification Steps

### **Before Scraping:**

1. ✅ Check robots.txt allows crawling
2. ✅ Test URL returns 200 status
3. ✅ Verify PDF/content is accessible
4. ✅ Confirm document is actually public (not behind login)

### **After Scraping:**

1. ✅ Verify PDF is valid (not corrupted)
2. ✅ Check file size (DDUs typically 100KB-2MB)
3. ✅ Extract text successfully
4. ✅ Confirm it's official government document (check headers, watermarks)

---

## 🎯 Summary

### **Main Sources:**

1. **MINVU:** https://www.minvu.gob.cl (DDUs, CIRs, OGUC)
2. **BCN:** https://www.bcn.cl/leychile/ (Laws, OGUC official text)
3. **Congreso:** https://www.congreso.cl (Projects)
4. **Judicial:** https://oficinajudicialvirtual.pjud.cl/ (Rulings)

### **Best Starting Point:**

**For DDU-493 specifically:**
```
1. Try: https://www.minvu.gob.cl/wp-content/uploads/2019/04/DDU-493.pdf
2. Or search: https://www.minvu.gob.cl → "DDU-493"
3. Or Google: site:minvu.gob.cl "DDU-493" filetype:pdf
```

**For CIR-182 specifically:**
```
1. Try: https://www.minvu.gob.cl/wp-content/uploads/2018/06/CIR-182.pdf
2. Or search: https://www.minvu.gob.cl → "CIR-182"
```

---

## 🤖 Implementation in Calendar System

**Create 5 calendar events** (one per source):

```typescript
const m001Sources = [
  {
    name: "MINVU DDU Documents",
    url: "https://www.minvu.gob.cl/elementos-tecnicos/ddu/",
    frequency: "monthly"
  },
  {
    name: "MINVU Circulares",
    url: "https://www.minvu.gob.cl/elementos-tecnicos/circulares/",
    frequency: "monthly"
  },
  {
    name: "OGUC Updates",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=13560",
    frequency: "quarterly"
  },
  {
    name: "Congressional Urban Projects",
    url: "https://www.congreso.cl/pley/",
    frequency: "daily"
  },
  {
    name: "Urban Development Jurisprudence",
    url: "https://oficinajudicialvirtual.pjud.cl/",
    frequency: "weekly"
  }
];
```

**Total captures:** 538 documents initially + 30-50 new/month

**Result:** Always up-to-date "Chilean Urban Development & Zoning Database"

---

**These are the official government URLs for M001 documents!** 🌐


