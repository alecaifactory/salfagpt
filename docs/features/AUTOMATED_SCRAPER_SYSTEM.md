# Automated Web Scraper System - Flow Platform

## 🎯 Purpose

Complete automated source capture system that allows users to:
1. Input a URL (e.g., congreso.cl project page)
2. Set update frequency (daily, weekly, etc.)
3. System automatically:
   - Scrapes content on schedule
   - Uploads to GCS
   - Extracts text with Gemini
   - Vectorizes with BigQuery GREEN
   - Creates/updates agent with context
   - Assigns to organization/domain

**User Experience:** Paste URL → Set frequency → Done. Agent appears ready to use.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATED SCRAPER SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER INPUT                                                 │
│  └─ URL: https://congreso.cl/proyecto/123                  │
│  └─ Frequency: daily/weekly/on-demand                      │
│  └─ Tags: #proyecto-ley, #congreso                         │
│                                                             │
│  ↓                                                          │
│                                                             │
│  SCRAPER CONFIGURATION (Firestore)                         │
│  ├─ scraper_configs collection                             │
│  ├─ scraper_runs collection (execution history)            │
│  └─ scraper_errors collection (error tracking)             │
│                                                             │
│  ↓                                                          │
│                                                             │
│  SCHEDULER                                                  │
│  ├─ Cloud Scheduler (production)                           │
│  ├─ OR node-cron (development)                             │
│  └─ Triggers scraper based on frequency                    │
│                                                             │
│  ↓                                                          │
│                                                             │
│  SCRAPER ENGINE (Puppeteer)                                │
│  ├─ Launch headless browser                                │
│  ├─ Navigate to URL                                        │
│  ├─ Extract content (text, PDFs, metadata)                 │
│  ├─ Handle pagination, dynamic content                     │
│  ├─ Save raw HTML + processed content                      │
│  └─ Upload to GCS                                          │
│                                                             │
│  ↓                                                          │
│                                                             │
│  EXTRACTION PIPELINE                                        │
│  ├─ Gemini 2.5 Flash (extract text from HTML/PDF)         │
│  ├─ Save to context_sources collection                     │
│  └─ Metadata: source URL, scrape date, version             │
│                                                             │
│  ↓                                                          │
│                                                             │
│  VECTORIZATION (BigQuery GREEN)                            │
│  ├─ Generate embeddings                                    │
│  ├─ Store in vector_search_green table                     │
│  └─ Enable semantic search                                 │
│                                                             │
│  ↓                                                          │
│                                                             │
│  AGENT CREATION/UPDATE                                      │
│  ├─ Create agent (if first scrape)                         │
│  ├─ Update context (if agent exists)                       │
│  ├─ Generate system prompt with scrape metadata            │
│  ├─ Assign to organization/domain                          │
│  └─ Activate agent for users                               │
│                                                             │
│  ↓                                                          │
│                                                             │
│  NOTIFICATION                                               │
│  └─ Notify user: "Agent ready" or "Content updated"        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### 1. scraper_configs Collection

```typescript
interface ScraperConfig {
  // Identity
  id: string;                           // Auto-generated
  userId: string;                       // Creator (indexed)
  organizationId: string;               // Org isolation (indexed)
  
  // Source
  name: string;                         // User-friendly name
  sourceUrl: string;                    // URL to scrape
  sourceType: 'congreso' | 'web' | 'pdf' | 'rss' | 'api' | 'custom';
  
  // Scheduling
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'cron';
  cronExpression?: string;              // For custom schedules
  timezone: string;                     // e.g., 'America/Santiago'
  nextRunAt?: Date;                     // Calculated next execution
  
  // Scraper Settings
  scraperSettings: {
    waitForSelector?: string;           // CSS selector to wait for
    scrollToBottom?: boolean;           // For infinite scroll
    clickSelectors?: string[];          // Buttons to click
    extractSelectors?: {                // What to extract
      title?: string;
      content?: string;
      metadata?: Record<string, string>;
    };
    downloadPDFs?: boolean;             // Auto-download linked PDFs
    followLinks?: {                     // Pagination/related pages
      selector: string;
      maxDepth: number;
    };
    authentication?: {                  // If login required
      type: 'basic' | 'form' | 'oauth';
      credentials?: any;                // Encrypted
    };
  };
  
  // Output Configuration
  tags: string[];                       // Classification tags
  assignToOrganization: string;         // Org ID
  assignToDomains: string[];            // Domain IDs
  autoCreateAgent: boolean;             // Create agent on first scrape
  agentTemplate?: {
    title: string;                      // Agent name template
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    systemPromptTemplate: string;       // Template with placeholders
  };
  
  // Status
  status: 'active' | 'paused' | 'error' | 'disabled';
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastErrorAt?: Date;
  runCount: number;
  successCount: number;
  errorCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;                    // User ID
  source: 'localhost' | 'production';
}
```

**Indexes:**
```
- userId ASC, status ASC, nextRunAt ASC
- organizationId ASC, status ASC
- sourceType ASC, nextRunAt ASC
```

---

### 2. scraper_runs Collection

```typescript
interface ScraperRun {
  // Identity
  id: string;
  scraperId: string;                    // Parent scraper config (indexed)
  userId: string;                       // Owner
  organizationId: string;               // Org
  
  // Execution
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Results
  contentHash?: string;                 // MD5 of scraped content
  hasChanges: boolean;                  // Different from last scrape
  itemsScraped: number;                 // Pages/documents found
  bytesDownloaded: number;              // Total size
  
  // Storage
  gcsPath?: string;                     // Raw HTML storage
  contextSourceId?: string;             // Created context source
  agentId?: string;                     // Created/updated agent
  
  // Resources
  pagesVisited: number;
  pdfsDownloaded: number;
  imagesDownloaded: number;
  
  // Performance
  inputTokens?: number;                 // Gemini extraction
  outputTokens?: number;
  estimatedCost?: number;               // USD
  
  // Error
  error?: {
    message: string;
    code: string;
    stack?: string;
    screenshot?: string;                // GCS path to error screenshot
  };
  
  // Metadata
  timestamp: Date;
  source: 'localhost' | 'production';
}
```

**Indexes:**
```
- scraperId ASC, timestamp DESC
- organizationId ASC, status ASC, timestamp DESC
- status ASC, nextRunAt ASC
```

---

### 3. scraper_errors Collection

```typescript
interface ScraperError {
  id: string;
  scraperId: string;
  runId: string;
  userId: string;
  organizationId: string;
  
  errorType: 'network' | 'timeout' | 'selector' | 'extraction' | 'storage' | 'authentication' | 'other';
  errorMessage: string;
  errorStack?: string;
  
  url: string;                          // Where error occurred
  screenshotPath?: string;              // GCS path
  htmlPath?: string;                    // Failed page HTML
  
  retryCount: number;
  resolved: boolean;
  resolvedAt?: Date;
  
  timestamp: Date;
}
```

---

## 🔧 Implementation Components

### 1. Scraper Configuration UI

**Component:** `src/components/ScraperConfigModal.tsx`

```typescript
interface ScraperConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Partial<ScraperConfig>) => Promise<void>;
  initialConfig?: ScraperConfig;
}

export function ScraperConfigModal({ isOpen, onClose, onSave, initialConfig }: ScraperConfigModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<Partial<ScraperConfig>>({
    frequency: 'daily',
    autoCreateAgent: true,
    sourceType: 'web',
    tags: [],
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Automated Scraper">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1: Source Configuration</h3>
          
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Source URL
            </label>
            <input
              type="url"
              value={config.sourceUrl || ''}
              onChange={(e) => setConfig({ ...config, sourceUrl: e.target.value })}
              placeholder="https://congreso.cl/proyecto/12345"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">
              Examples: Congreso projects, legal docs, news sites, reports
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Scraper Name
            </label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="Proyecto Ley 12345"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Source Type (auto-detected)
            </label>
            <select
              value={config.sourceType}
              onChange={(e) => setConfig({ ...config, sourceType: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="congreso">Congreso.cl (optimized)</option>
              <option value="web">Generic Web Page</option>
              <option value="pdf">PDF Document</option>
              <option value="rss">RSS Feed</option>
              <option value="custom">Custom Scraper</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              placeholder="proyecto-ley, congreso, reforma"
              onChange={(e) => setConfig({ 
                ...config, 
                tags: e.target.value.split(',').map(t => t.trim()) 
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Next: Schedule →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 2: Update Schedule</h3>
          
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Update Frequency
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfig({ ...config, frequency: 'manual' })}
                className={`px-4 py-3 border rounded-lg ${
                  config.frequency === 'manual' ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                Manual Only
              </button>
              <button
                onClick={() => setConfig({ ...config, frequency: 'daily' })}
                className={`px-4 py-3 border rounded-lg ${
                  config.frequency === 'daily' ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setConfig({ ...config, frequency: 'weekly' })}
                className={`px-4 py-3 border rounded-lg ${
                  config.frequency === 'weekly' ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setConfig({ ...config, frequency: 'cron' })}
                className={`px-4 py-3 border rounded-lg ${
                  config.frequency === 'cron' ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                Custom Schedule
              </button>
            </div>
          </div>

          {/* Cron expression (if custom) */}
          {config.frequency === 'cron' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Cron Expression
              </label>
              <input
                type="text"
                value={config.cronExpression || ''}
                onChange={(e) => setConfig({ ...config, cronExpression: e.target.value })}
                placeholder="0 9 * * 1-5"
                className="w-full px-4 py-2 border rounded-lg font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Example: "0 9 * * 1-5" = Every weekday at 9 AM
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 border rounded-lg"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Next: Agent →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 3: Agent Configuration</h3>
          
          {/* Auto-create agent */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.autoCreateAgent}
              onChange={(e) => setConfig({ ...config, autoCreateAgent: e.target.checked })}
              className="w-5 h-5"
            />
            <label className="text-sm font-medium">
              Automatically create/update agent with scraped content
            </label>
          </div>

          {config.autoCreateAgent && (
            <>
              {/* Agent Name Template */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Agent Name Template
                </label>
                <input
                  type="text"
                  value={config.agentTemplate?.title || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    agentTemplate: {
                      ...config.agentTemplate!,
                      title: e.target.value
                    }
                  })}
                  placeholder="Proyecto Ley {scraped_title}"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use {`{scraped_title}`}, {`{source_url}`}, {`{date}`} as placeholders
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  AI Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      agentTemplate: { ...config.agentTemplate!, model: 'gemini-2.5-flash' }
                    })}
                    className={`px-4 py-3 border rounded-lg ${
                      config.agentTemplate?.model === 'gemini-2.5-flash' 
                        ? 'border-green-600 bg-green-50' 
                        : ''
                    }`}
                  >
                    ✨ Flash (Fast)
                  </button>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      agentTemplate: { ...config.agentTemplate!, model: 'gemini-2.5-pro' }
                    })}
                    className={`px-4 py-3 border rounded-lg ${
                      config.agentTemplate?.model === 'gemini-2.5-pro' 
                        ? 'border-purple-600 bg-purple-50' 
                        : ''
                    }`}
                  >
                    💎 Pro (Precise)
                  </button>
                </div>
              </div>

              {/* System Prompt Template */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  System Prompt Template
                </label>
                <textarea
                  value={config.agentTemplate?.systemPromptTemplate || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    agentTemplate: {
                      ...config.agentTemplate!,
                      systemPromptTemplate: e.target.value
                    }
                  })}
                  placeholder="Eres un asistente experto en proyectos de ley chilenos. Tienes acceso a {scraped_content_summary}. Responde con precisión basándote en el contenido oficial."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Domain Assignment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Assign to Domains
                </label>
                <select
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                    setConfig({ ...config, assignToDomains: selected });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="salfagestion.cl">salfagestion.cl</option>
                  <option value="getaifactory.com">getaifactory.com</option>
                  {/* Dynamic from org */}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-4 py-2 border rounded-lg"
            >
              ← Back
            </button>
            <button
              onClick={() => handleSave()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Create Scraper
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
```

---

### 2. Puppeteer Scraper Engine

**File:** `src/lib/scraper-engine.ts`

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { Storage } from '@google-cloud/storage';
import { firestore } from './firestore';
import { extractWithGemini } from './gemini';
import { createContextSource } from './firestore';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

export class ScraperEngine {
  private browser: Browser | null = null;

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrape(config: ScraperConfig): Promise<ScraperResult> {
    const runId = `run_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      // 1. Update scraper run status
      await this.createRun(config.id, runId, 'running');

      // 2. Launch page
      const page = await this.browser!.newPage();
      
      // 3. Navigate to URL
      await page.goto(config.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // 4. Wait for dynamic content (if configured)
      if (config.scraperSettings.waitForSelector) {
        await page.waitForSelector(config.scraperSettings.waitForSelector, {
          timeout: 10000
        });
      }

      // 5. Handle scrolling (infinite scroll)
      if (config.scraperSettings.scrollToBottom) {
        await this.autoScroll(page);
      }

      // 6. Click elements (expand sections, etc.)
      if (config.scraperSettings.clickSelectors) {
        for (const selector of config.scraperSettings.clickSelectors) {
          try {
            await page.click(selector);
            await page.waitForTimeout(1000); // Wait for content to load
          } catch (e) {
            console.warn(`Could not click selector: ${selector}`);
          }
        }
      }

      // 7. Extract content
      const extractedData = await page.evaluate((selectors) => {
        return {
          title: document.querySelector(selectors.title)?.textContent || document.title,
          content: document.querySelector(selectors.content)?.innerHTML || document.body.innerHTML,
          metadata: Object.fromEntries(
            Object.entries(selectors.metadata || {}).map(([key, selector]) => [
              key,
              document.querySelector(selector)?.textContent || ''
            ])
          )
        };
      }, config.scraperSettings.extractSelectors || {});

      // 8. Download PDFs (if configured)
      let pdfs: string[] = [];
      if (config.scraperSettings.downloadPDFs) {
        const pdfLinks = await page.$$eval('a[href$=".pdf"]', links =>
          links.map(link => (link as HTMLAnchorElement).href)
        );
        
        pdfs = await this.downloadPDFs(pdfLinks, config.id, runId);
      }

      // 9. Save raw HTML to GCS
      const htmlPath = await this.saveToGCS(
        config.id,
        runId,
        'page.html',
        extractedData.content
      );

      // 10. Extract text with Gemini
      const extractionResult = await extractWithGemini(
        extractedData.content,
        'gemini-2.5-flash'
      );

      // 11. Create context source
      const contextSource = await createContextSource(config.userId, {
        name: extractedData.title,
        type: 'web-url',
        extractedData: extractionResult.text,
        metadata: {
          originalUrl: config.sourceUrl,
          scrapedAt: new Date(),
          scraperId: config.id,
          runId: runId,
          tags: config.tags,
          model: 'gemini-2.5-flash',
          extractionTime: extractionResult.durationMs,
          charactersExtracted: extractionResult.text.length,
          tokensEstimate: Math.ceil(extractionResult.text.length / 4),
        },
        assignedToAgents: [], // Will be assigned when agent is created
      });

      // 12. Create/update agent (if configured)
      let agentId: string | undefined;
      if (config.autoCreateAgent) {
        agentId = await this.createOrUpdateAgent(
          config,
          contextSource.id,
          extractedData,
          extractionResult.text
        );
      }

      // 13. Vectorize (BigQuery GREEN)
      await this.vectorize(contextSource.id, extractionResult.text);

      // 14. Update scraper run
      await this.updateRun(runId, {
        status: 'completed',
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        contentHash: this.hashContent(extractedData.content),
        hasChanges: true, // TODO: Compare with previous
        itemsScraped: 1 + pdfs.length,
        bytesDownloaded: extractedData.content.length,
        gcsPath: htmlPath,
        contextSourceId: contextSource.id,
        agentId: agentId,
        pagesVisited: 1,
        pdfsDownloaded: pdfs.length,
        inputTokens: extractionResult.inputTokens,
        outputTokens: extractionResult.outputTokens,
        estimatedCost: extractionResult.cost,
      });

      await page.close();

      return {
        success: true,
        contextSourceId: contextSource.id,
        agentId: agentId,
        runId: runId,
      };

    } catch (error) {
      // Handle error
      await this.handleError(config.id, runId, error);
      throw error;
    }
  }

  private async autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  private async downloadPDFs(urls: string[], scraperId: string, runId: string): Promise<string[]> {
    const downloaded: string[] = [];
    
    for (const url of urls) {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        
        const filename = url.split('/').pop() || `document_${Date.now()}.pdf`;
        const gcsPath = await this.saveToGCS(
          scraperId,
          runId,
          filename,
          Buffer.from(buffer)
        );
        
        downloaded.push(gcsPath);
      } catch (error) {
        console.error(`Failed to download PDF: ${url}`, error);
      }
    }
    
    return downloaded;
  }

  private async saveToGCS(
    scraperId: string,
    runId: string,
    filename: string,
    content: string | Buffer
  ): Promise<string> {
    const bucket = storage.bucket('salfagpt-scraped-content');
    const path = `scrapers/${scraperId}/${runId}/${filename}`;
    const file = bucket.file(path);
    
    await file.save(content, {
      metadata: {
        contentType: filename.endsWith('.pdf') ? 'application/pdf' : 'text/html',
      }
    });
    
    return `gs://salfagpt-scraped-content/${path}`;
  }

  private async createOrUpdateAgent(
    config: ScraperConfig,
    contextSourceId: string,
    extractedData: any,
    fullText: string
  ): Promise<string> {
    // Check if agent already exists for this scraper
    const existingAgents = await firestore
      .collection('conversations')
      .where('metadata.scraperId', '==', config.id)
      .limit(1)
      .get();

    // Generate summary for system prompt
    const summary = fullText.substring(0, 500) + '...';
    const systemPrompt = config.agentTemplate!.systemPromptTemplate
      .replace('{scraped_content_summary}', summary)
      .replace('{scraped_title}', extractedData.title)
      .replace('{source_url}', config.sourceUrl)
      .replace('{date}', new Date().toISOString().split('T')[0]);

    if (existingAgents.empty) {
      // Create new agent
      const agentRef = await firestore.collection('conversations').add({
        userId: config.userId,
        organizationId: config.organizationId,
        title: config.agentTemplate!.title
          .replace('{scraped_title}', extractedData.title),
        agentModel: config.agentTemplate!.model,
        agentPrompt: systemPrompt,
        activeContextSourceIds: [contextSourceId],
        tags: config.tags,
        metadata: {
          scraperId: config.id,
          scraperRunId: '',
          autoGenerated: true,
          sourceUrl: config.sourceUrl,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      });

      return agentRef.id;
    } else {
      // Update existing agent
      const agentDoc = existingAgents.docs[0];
      await agentDoc.ref.update({
        agentPrompt: systemPrompt,
        activeContextSourceIds: [contextSourceId],
        updatedAt: new Date(),
        'metadata.lastScraperRunId': '',
        'metadata.lastScrapedAt': new Date(),
      });

      return agentDoc.id;
    }
  }

  private async vectorize(contextSourceId: string, text: string) {
    // TODO: Call BigQuery GREEN vectorization
    // See existing vectorization implementation
    console.log(`📊 Vectorizing context source: ${contextSourceId}`);
  }

  private hashContent(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async createRun(scraperId: string, runId: string, status: string) {
    await firestore.collection('scraper_runs').doc(runId).set({
      id: runId,
      scraperId: scraperId,
      status: status,
      startedAt: new Date(),
      timestamp: new Date(),
    });
  }

  private async updateRun(runId: string, updates: Partial<ScraperRun>) {
    await firestore.collection('scraper_runs').doc(runId).update(updates);
  }

  private async handleError(scraperId: string, runId: string, error: any) {
    await firestore.collection('scraper_errors').add({
      scraperId,
      runId,
      errorType: 'other',
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date(),
      retryCount: 0,
      resolved: false,
    });

    await this.updateRun(runId, {
      status: 'failed',
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN',
      },
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

---

### 3. Scheduling System

**File:** `src/lib/scraper-scheduler.ts`

```typescript
import cron from 'node-cron';
import { firestore } from './firestore';
import { ScraperEngine } from './scraper-engine';

export class ScraperScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private engine: ScraperEngine;

  constructor() {
    this.engine = new ScraperEngine();
  }

  async initialize() {
    await this.engine.initialize();
    
    // Load all active scrapers
    const scrapers = await firestore
      .collection('scraper_configs')
      .where('status', '==', 'active')
      .get();

    // Schedule each scraper
    for (const doc of scrapers.docs) {
      const config = { id: doc.id, ...doc.data() } as ScraperConfig;
      await this.scheduleScraperConfig(config);
    }

    console.log(`✅ Scheduled ${this.scheduledJobs.size} scrapers`);
  }

  async scheduleScraperConfig(config: ScraperConfig) {
    // Skip if manual only
    if (config.frequency === 'manual') {
      return;
    }

    // Convert frequency to cron expression
    const cronExpression = this.getCronExpression(config);

    // Schedule job
    const task = cron.schedule(cronExpression, async () => {
      console.log(`🕐 Running scheduled scraper: ${config.name}`);
      
      try {
        await this.engine.scrape(config);
        console.log(`✅ Scraper completed: ${config.name}`);
      } catch (error) {
        console.error(`❌ Scraper failed: ${config.name}`, error);
      }
    }, {
      timezone: config.timezone || 'America/Santiago'
    });

    this.scheduledJobs.set(config.id, task);
  }

  private getCronExpression(config: ScraperConfig): string {
    if (config.frequency === 'cron' && config.cronExpression) {
      return config.cronExpression;
    }

    switch (config.frequency) {
      case 'daily':
        return '0 9 * * *'; // Every day at 9 AM
      case 'weekly':
        return '0 9 * * 1'; // Every Monday at 9 AM
      case 'monthly':
        return '0 9 1 * *'; // First day of month at 9 AM
      default:
        return '0 9 * * *'; // Default to daily
    }
  }

  async runScraperNow(scraperId: string) {
    const doc = await firestore.collection('scraper_configs').doc(scraperId).get();
    
    if (!doc.exists) {
      throw new Error('Scraper not found');
    }

    const config = { id: doc.id, ...doc.data() } as ScraperConfig;
    return await this.engine.scrape(config);
  }

  async pauseScraper(scraperId: string) {
    const task = this.scheduledJobs.get(scraperId);
    if (task) {
      task.stop();
    }

    await firestore.collection('scraper_configs').doc(scraperId).update({
      status: 'paused',
      updatedAt: new Date(),
    });
  }

  async resumeScraper(scraperId: string) {
    const task = this.scheduledJobs.get(scraperId);
    if (task) {
      task.start();
    }

    await firestore.collection('scraper_configs').doc(scraperId).update({
      status: 'active',
      updatedAt: new Date(),
    });
  }

  async shutdown() {
    // Stop all scheduled jobs
    for (const task of this.scheduledJobs.values()) {
      task.stop();
    }
    
    await this.engine.close();
  }
}

// Singleton instance
let schedulerInstance: ScraperScheduler | null = null;

export async function getScheduler(): Promise<ScraperScheduler> {
  if (!schedulerInstance) {
    schedulerInstance = new ScraperScheduler();
    await schedulerInstance.initialize();
  }
  return schedulerInstance;
}
```

---

### 4. Pre-built Scrapers for Common Sources

**File:** `src/lib/scrapers/congreso-scraper.ts`

```typescript
/**
 * Optimized scraper for Congreso.cl
 * Handles Chilean congressional projects
 */
export const congresoScraperConfig: Partial<ScraperConfig> = {
  sourceType: 'congreso',
  scraperSettings: {
    waitForSelector: '.proyecto-detalle',
    extractSelectors: {
      title: 'h1.proyecto-titulo',
      content: '.proyecto-contenido',
      metadata: {
        numero: '.proyecto-numero',
        fecha: '.proyecto-fecha',
        estado: '.proyecto-estado',
        camara: '.proyecto-camara',
      }
    },
    downloadPDFs: true,
    followLinks: {
      selector: 'a.documento-relacionado',
      maxDepth: 1,
    }
  },
  agentTemplate: {
    title: 'Proyecto Ley {scraped_title}',
    model: 'gemini-2.5-flash',
    systemPromptTemplate: `Eres un asistente experto en legislación chilena.

Tienes acceso completo al Proyecto de Ley "{scraped_title}" obtenido de {source_url}.

CONTENIDO DEL PROYECTO:
{scraped_content_summary}

Tu función es:
- Explicar el proyecto de ley en términos claros
- Responder preguntas sobre su contenido, impacto y estado
- Citar artículos específicos cuando sea relevante
- Indicar cuando algo no está cubierto en el proyecto

Responde siempre basándote en el contenido oficial del proyecto.`
  }
};
```

**File:** `src/lib/scrapers/generic-web-scraper.ts`

```typescript
/**
 * Generic web page scraper
 * Works for most standard websites
 */
export const genericWebScraperConfig: Partial<ScraperConfig> = {
  sourceType: 'web',
  scraperSettings: {
    waitForSelector: 'body',
    extractSelectors: {
      title: 'h1, title',
      content: 'article, main, .content, body',
    },
    scrollToBottom: true,
  },
  agentTemplate: {
    title: 'Web Content: {scraped_title}',
    model: 'gemini-2.5-flash',
    systemPromptTemplate: `Eres un asistente experto con acceso a contenido web actualizado.

Fuente: {source_url}
Última actualización: {date}
Título: {scraped_title}

CONTENIDO:
{scraped_content_summary}

Responde preguntas sobre este contenido con precisión, citando secciones cuando sea relevante.`
  }
};
```

---

### 5. API Endpoints

**File:** `src/pages/api/scrapers/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

// GET - List user's scrapers
export const GET: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies } as any);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (session.id !== userId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const scrapers = await firestore
    .collection('scraper_configs')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return new Response(JSON.stringify({
    scrapers: scrapers.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

// POST - Create scraper
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies } as any);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { config } = body;

  // Create scraper config
  const scraperRef = await firestore.collection('scraper_configs').add({
    ...config,
    userId: session.id,
    status: 'active',
    runCount: 0,
    successCount: 0,
    errorCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: session.id,
    source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
  });

  // Schedule if not manual
  if (config.frequency !== 'manual') {
    const { getScheduler } = await import('../../../lib/scraper-scheduler');
    const scheduler = await getScheduler();
    await scheduler.scheduleScraperConfig({ id: scraperRef.id, ...config });
  }

  return new Response(JSON.stringify({
    id: scraperRef.id,
    message: 'Scraper created successfully'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

**File:** `src/pages/api/scrapers/[id]/run.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore } from '../../../../lib/firestore';
import { getScheduler } from '../../../../lib/scraper-scheduler';

// POST - Run scraper now
export const POST: APIRoute = async ({ params, cookies }) => {
  const session = getSession({ cookies } as any);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;

  // Verify ownership
  const scraperDoc = await firestore.collection('scraper_configs').doc(id!).get();
  if (!scraperDoc.exists) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const scraper = scraperDoc.data();
  if (scraper?.userId !== session.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // Run scraper
  try {
    const scheduler = await getScheduler();
    const result = await scheduler.runScraperNow(id!);

    return new Response(JSON.stringify({
      success: true,
      runId: result.runId,
      contextSourceId: result.contextSourceId,
      agentId: result.agentId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Scraper failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## 🚀 Deployment

### Production Setup (Cloud Run + Cloud Scheduler)

**1. Install Puppeteer with Chrome**

```dockerfile
# Dockerfile
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
```

**2. Deploy to Cloud Run**

```bash
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --memory 2Gi \
  --timeout 540s \
  --max-instances 10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt"
```

**3. Create Cloud Scheduler Jobs**

```bash
# For each active scraper, create a Cloud Scheduler job
gcloud scheduler jobs create http scraper-{scraper_id} \
  --location=us-east4 \
  --schedule="0 9 * * *" \
  --uri="https://your-service.run.app/api/scrapers/{scraper_id}/run" \
  --http-method=POST \
  --headers="Authorization=Bearer $(gcloud auth print-identity-token)"
```

---

## 📊 Monitoring Dashboard

**Component:** `src/components/ScraperManagementDashboard.tsx`

```typescript
export function ScraperManagementDashboard() {
  const [scrapers, setScrapers] = useState<ScraperConfig[]>([]);
  const [selectedScraper, setSelectedScraper] = useState<string | null>(null);
  const [runs, setRuns] = useState<ScraperRun[]>([]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automated Scrapers</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Scraper
        </button>
      </div>

      {/* Scrapers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scrapers.map(scraper => (
          <div
            key={scraper.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{scraper.name}</h3>
                <p className="text-sm text-slate-600">{scraper.sourceUrl}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                scraper.status === 'active' ? 'bg-green-100 text-green-700' :
                scraper.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {scraper.status}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
              <div>
                <p className="text-slate-500">Runs</p>
                <p className="font-semibold">{scraper.runCount}</p>
              </div>
              <div>
                <p className="text-slate-500">Success</p>
                <p className="font-semibold text-green-600">{scraper.successCount}</p>
              </div>
              <div>
                <p className="text-slate-500">Errors</p>
                <p className="font-semibold text-red-600">{scraper.errorCount}</p>
              </div>
            </div>

            {/* Last Run */}
            {scraper.lastRunAt && (
              <p className="text-xs text-slate-500 mb-3">
                Last run: {formatDistanceToNow(scraper.lastRunAt)} ago
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleRunNow(scraper.id)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm"
              >
                Run Now
              </button>
              <button
                onClick={() => handleViewDetails(scraper.id)}
                className="px-3 py-2 border rounded text-sm"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Run History (when scraper selected) */}
      {selectedScraper && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Run History</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Started</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Items</th>
                <th className="px-4 py-2 text-left">Changes</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} className="border-b">
                  <td className="px-4 py-2">{formatDateTime(run.startedAt!)}</td>
                  <td className="px-4 py-2">{run.durationMs}ms</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      run.status === 'completed' ? 'bg-green-100 text-green-700' :
                      run.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{run.itemsScraped}</td>
                  <td className="px-4 py-2">
                    {run.hasChanges ? '✅ Yes' : '⚪ No changes'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-blue-600 text-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Complete User Flow

### Example: Scraping Congreso Project

**Step 1: User Configuration (30 seconds)**
```
User clicks: "+ New Scraper"
  ↓
Pastes URL: https://congreso.cl/proyecto/12345
  ↓
Selects: "Congreso.cl (optimized)" (auto-detected)
  ↓
Sets frequency: "Daily at 9 AM"
  ↓
Clicks: "Create Scraper"
```

**Step 2: First Run (Automatic, 30-60 seconds)**
```
System schedules job
  ↓
Runs immediately for first time
  ↓
Puppeteer navigates to URL
  ↓
Waits for .proyecto-detalle selector
  ↓
Extracts: title, content, metadata
  ↓
Downloads linked PDFs
  ↓
Saves raw HTML to GCS
```

**Step 3: Processing (60-120 seconds)**
```
Gemini extracts clean text
  ↓
Creates context_source document
  ↓
Vectorizes with BigQuery GREEN
  ↓
Generates system prompt:
  "Eres experto en Proyecto Ley [title]..."
```

**Step 4: Agent Creation (10 seconds)**
```
Creates conversation document:
  title: "Proyecto Ley [title]"
  agentModel: gemini-2.5-flash
  agentPrompt: [generated prompt]
  activeContextSourceIds: [context_source_id]
  tags: #proyecto-ley, #congreso
  organizationId: [user's org]
  assignToDomains: [selected domains]
```

**Step 5: User Notification (5 seconds)**
```
Email/notification:
  "Your agent 'Proyecto Ley XYZ' is ready!"
  
User sees in sidebar:
  New agent with 🤖 icon
  Ready to chat immediately
```

**Total Time:** ~2-3 minutes from URL input to ready agent

---

## ✅ Success Criteria

### Functional Requirements
- ✅ User inputs URL + frequency only
- ✅ System scrapes automatically on schedule
- ✅ Content extracted and vectorized
- ✅ Agent created with complete context
- ✅ Agent assigned to org/domain correctly
- ✅ Updates happen automatically (daily/weekly)
- ✅ User notified when agent ready/updated

### Performance
- ✅ Scrape completes in < 60s (p95)
- ✅ Agent ready in < 3 minutes total
- ✅ Handles 100+ scrapers concurrently
- ✅ Detects content changes efficiently

### Quality
- ✅ Accurate text extraction (> 95%)
- ✅ PDF downloads work reliably
- ✅ Handles dynamic content (JS rendering)
- ✅ Error recovery and retry logic
- ✅ No duplicate agent creation

### Security
- ✅ Scrapers isolated per user/org
- ✅ No unauthorized access to scraped content
- ✅ Encrypted credentials for auth
- ✅ Rate limiting to prevent abuse

---

## 🔄 Next Implementation Steps

This design is ready for implementation. Would you like me to:

1. **Start with the data model** - Create Firestore collections and types
2. **Build the Puppeteer engine** - Core scraping functionality
3. **Create the scheduler** - Automated execution system
4. **Build the UI** - User configuration interface
5. **Implement Congreso scraper** - First production use case

Which component should we start with?


