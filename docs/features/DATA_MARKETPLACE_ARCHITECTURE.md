# Data Marketplace Architecture - Flow Platform
## DaaS + MCP-as-a-Service Business Model

## 🎯 Vision

Transform scraped datasets into monetizable, multi-tenant data products accessible via:
- **MCP Servers** (Cursor AI-ready)
- **npm SDKs** (Developer-ready)
- **REST APIs** (Integration-ready)
- **Pub/Sub Streams** (Real-time ready)

**Revenue Model:** Subscription-based access to curated, domain-specific datasets with automatic updates.

---

## 🏗️ Three-Sided Marketplace

```
┌─────────────────────────────────────────────────────────────┐
│                 DATA MARKETPLACE ECOSYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUPPLY SIDE (Data Providers)                               │
│  ├─ SuperAdmins configure scrapers                         │
│  ├─ Automated scraping (Congreso, legal, news, etc)       │
│  ├─ Manual uploads (expert-curated datasets)               │
│  └─ Quality validation & certification                     │
│                                                             │
│  ↓ (Data Processing Pipeline)                              │
│                                                             │
│  PLATFORM (AI Factory)                                      │
│  ├─ Scraper orchestration                                  │
│  ├─ Text extraction (Gemini)                               │
│  ├─ Vectorization (BigQuery GREEN)                         │
│  ├─ Auto-generate MCP servers                              │
│  ├─ Auto-generate npm SDKs                                 │
│  ├─ Auto-generate API docs                                 │
│  ├─ Pub/Sub stream management                              │
│  ├─ Usage tracking & billing                               │
│  └─ Quality assurance & SLAs                               │
│                                                             │
│  ↓ (Distribution Channels)                                 │
│                                                             │
│  DEMAND SIDE (Customers)                                    │
│  ├─ Construction companies                                 │
│  ├─ Legal firms                                            │
│  ├─ Financial institutions                                 │
│  ├─ Government agencies                                    │
│  ├─ AI application developers                              │
│  └─ Research institutions                                  │
│                                                             │
│  ACCESS METHODS:                                            │
│  ├─ MCP Server (Cursor integration) → cursor.com          │
│  ├─ npm SDK (npm install @flow/congreso-data)             │
│  ├─ REST API (https://api.flow.ai/datasets/congreso)      │
│  └─ Pub/Sub (real-time updates)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing Model

### Tier 1: Basic Access (Developer Tier)
**Price:** $49/month per dataset

**Includes:**
- ✅ REST API access (10,000 requests/month)
- ✅ npm SDK
- ✅ Weekly updates
- ✅ 30-day historical data
- ✅ Community support

**Use Case:** Solo developers, small projects

---

### Tier 2: Professional (Business Tier)
**Price:** $299/month per dataset

**Includes:**
- ✅ Everything in Basic
- ✅ MCP Server (Cursor-ready)
- ✅ Daily updates
- ✅ 1-year historical data
- ✅ 100,000 requests/month
- ✅ Pub/Sub stream access
- ✅ Priority support (24h response)

**Use Case:** Companies, production apps

---

### Tier 3: Enterprise (Managed Service)
**Price:** $1,499/month per dataset

**Includes:**
- ✅ Everything in Professional
- ✅ Hourly updates (or custom frequency)
- ✅ Full historical data (unlimited)
- ✅ Unlimited API requests
- ✅ Dedicated MCP server instance
- ✅ Custom scraper configuration
- ✅ White-label SDK
- ✅ SLA guarantees (99.9% uptime)
- ✅ Dedicated support (1h response)
- ✅ Data quality certification

**Use Case:** Enterprises, mission-critical systems

---

### Usage-Based Add-Ons

**Vector Search:**
- $0.10 per 1,000 vector searches
- Includes semantic similarity scoring
- Real-time results

**Custom Scrapers:**
- $500 setup fee
- $99/month maintenance
- Tailored to specific sources

**Historical Data Backfill:**
- $100 per year of historical data
- One-time fee
- Delivered within 48 hours

**Multi-Tenant Deployment:**
- $2,000/month
- Isolated GCP project
- Custom domain
- Dedicated resources

---

## 📊 Data Product Structure

### Dataset Catalog

Each dataset is a **product** with:

```typescript
interface DataProduct {
  // Identity
  id: string;                           // e.g., 'congreso-proyectos-ley'
  name: string;                         // "Chilean Congressional Projects"
  category: string;                     // 'legal', 'government', 'finance'
  
  // Description
  description: string;                  // Marketing description
  dataSchema: DataSchema;               // What fields are available
  sampleData: any[];                    // 3-5 example records
  
  // Source
  sourceType: 'scraper' | 'manual' | 'api' | 'partnership';
  scraperIds: string[];                 // If scraped
  updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastUpdated: Date;
  recordCount: number;
  sizeGB: number;
  
  // Quality
  qualityScore: number;                 // 0-100
  certifiedBy?: string;                 // Expert validator
  certifiedAt?: Date;
  dataFreshness: 'real-time' | 'daily' | 'weekly';
  
  // Access Methods
  accessMethods: {
    mcpServer: {
      enabled: boolean;
      serverUrl?: string;               // For Cursor
      version: string;
    };
    npmSdk: {
      enabled: boolean;
      packageName?: string;             // @flow/congreso-data
      version: string;
    };
    restApi: {
      enabled: boolean;
      endpoint?: string;
      docsUrl?: string;
    };
    pubsub: {
      enabled: boolean;
      topicName?: string;
    };
  };
  
  // Pricing
  pricingTiers: {
    basic: { price: number; limits: any };
    professional: { price: number; limits: any };
    enterprise: { price: number; limits: any };
  };
  
  // Stats
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  
  // Metadata
  createdAt: Date;
  createdBy: string;                    // SuperAdmin
  featured: boolean;                    // Show in marketplace
  tags: string[];
}
```

---

### Data Subscription

```typescript
interface DataSubscription {
  // Identity
  id: string;
  customerId: string;                   // Organization ID
  dataProductId: string;                // Dataset
  
  // Tier
  tier: 'basic' | 'professional' | 'enterprise';
  
  // Access Configuration
  accessMethods: ('mcp' | 'npm' | 'api' | 'pubsub')[];
  
  // Pub/Sub Configuration (if enabled)
  pubsubConfig?: {
    topicName: string;                  // Customer-specific topic
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
    filterTags?: string[];              // Only matching tags
    transformations?: string[];         // Data transformations
  };
  
  // Billing
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  billingCycle: 'monthly' | 'annual';
  pricePerMonth: number;
  nextBillingDate: Date;
  trialEndsAt?: Date;
  
  // Usage Tracking
  currentPeriod: {
    apiRequests: number;
    vectorSearches: number;
    pubsubMessages: number;
    cost: number;
  };
  
  // MCP Server (if tier includes)
  mcpServer?: {
    serverId: string;                   // Auto-generated
    apiKey: string;                     // Customer-specific
    serverUrl: string;
  };
  
  // npm SDK (if tier includes)
  npmSdk?: {
    packageName: string;
    accessToken: string;                // For private registry
    version: string;
  };
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
}
```

---

## 🔧 SCRAPPY Settings (SuperAdmin Panel)

### SuperAdmin Configuration UI

**Component:** `src/components/admin/SCRAPPYSettingsPanel.tsx`

**Location:** Only visible to SuperAdmin users

```typescript
export function SCRAPPYSettingsPanel() {
  const { user } = useUser();
  
  // Security: Only SuperAdmin
  if (user?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SCRAPPY Settings</h1>
          <p className="text-slate-600 mt-1">
            Data Marketplace & Scraper Orchestration
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            + New Data Product
          </button>
          <button className="px-4 py-2 border rounded-lg">
            + New Scraper
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button className="px-4 py-2 border-b-2 border-blue-600 font-semibold">
            Data Products
          </button>
          <button className="px-4 py-2 text-slate-600">
            Active Scrapers
          </button>
          <button className="px-4 py-2 text-slate-600">
            Subscriptions
          </button>
          <button className="px-4 py-2 text-slate-600">
            Revenue Analytics
          </button>
          <button className="px-4 py-2 text-slate-600">
            MCP Servers
          </button>
        </nav>
      </div>

      {/* Data Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataProducts.map(product => (
          <DataProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function DataProductCard({ product }: { product: DataProduct }) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{product.name}</h3>
          <span className="text-xs text-slate-500">{product.category}</span>
        </div>
        {product.certifiedBy && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
            ✓ Certified
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-slate-500">Records</p>
          <p className="font-bold">{product.recordCount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-500">Updated</p>
          <p className="font-bold">{formatDistanceToNow(product.lastUpdated)} ago</p>
        </div>
        <div>
          <p className="text-slate-500">Subscriptions</p>
          <p className="font-bold">{product.activeSubscriptions}</p>
        </div>
        <div>
          <p className="text-slate-500">MRR</p>
          <p className="font-bold text-green-600">${product.monthlyRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Access Methods */}
      <div className="flex gap-2 mb-4">
        {product.accessMethods.mcpServer.enabled && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
            🔌 MCP
          </span>
        )}
        {product.accessMethods.npmSdk.enabled && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
            📦 npm
          </span>
        )}
        {product.accessMethods.restApi.enabled && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
            🌐 API
          </span>
        )}
        {product.accessMethods.pubsub.enabled && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
            📡 Stream
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm">
          Configure
        </button>
        <button className="px-3 py-2 border rounded text-sm">
          Analytics
        </button>
        <button className="px-3 py-2 border rounded text-sm">
          •••
        </button>
      </div>
    </div>
  );
}
```

---

## 📡 Pub/Sub Integration Architecture

### Customer Pub/Sub Topics

**Per subscription, auto-create:**

```typescript
// Topic naming: flow-data-{productId}-{customerId}
// Example: flow-data-congreso-proyectos-salfa-corp

interface PubSubTopicConfig {
  topicName: string;                    // GCP Pub/Sub topic
  subscriptionId: string;               // Customer subscription
  dataProductId: string;                // Source dataset
  customerId: string;                   // Organization
  
  // Delivery Configuration
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  batchSize: number;                    // Records per message
  
  // Filtering
  filters?: {
    tags?: string[];                    // Only matching tags
    dateRange?: { from: Date; to?: Date };
    keywords?: string[];
  };
  
  // Transformations
  transformations?: {
    includeVectors?: boolean;           // Include embeddings
    includeRawHtml?: boolean;           // Include source HTML
    format?: 'json' | 'jsonl' | 'csv';
    fields?: string[];                  // Specific fields only
  };
  
  // Schema
  messageSchema: {
    type: 'object';
    properties: Record<string, any>;
  };
  
  // Status
  status: 'active' | 'paused';
  messagesDelivered: number;
  lastDeliveredAt?: Date;
  
  createdAt: Date;
}
```

### Pub/Sub Publisher Service

**File:** `src/lib/pubsub-publisher.ts`

```typescript
import { PubSub } from '@google-cloud/pubsub';
import { firestore } from './firestore';

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

export class DataProductPublisher {
  /**
   * Publish scraped content to all subscribers
   */
  async publishScrapedContent(
    dataProductId: string,
    scraperId: string,
    runId: string,
    content: any
  ) {
    // Get all active subscriptions for this product
    const subscriptions = await firestore
      .collection('data_subscriptions')
      .where('dataProductId', '==', dataProductId)
      .where('status', '==', 'active')
      .where('accessMethods', 'array-contains', 'pubsub')
      .get();

    console.log(`📡 Publishing to ${subscriptions.size} subscribers`);

    for (const subDoc of subscriptions.docs) {
      const subscription = subDoc.data() as DataSubscription;
      
      try {
        await this.publishToSubscription(subscription, content, runId);
      } catch (error) {
        console.error(`Failed to publish to ${subscription.id}:`, error);
        // Log error but continue with other subscriptions
      }
    }
  }

  private async publishToSubscription(
    subscription: DataSubscription,
    content: any,
    runId: string
  ) {
    const topicConfig = subscription.pubsubConfig!;
    const topic = pubsub.topic(topicConfig.topicName);

    // Apply filters
    if (!this.matchesFilters(content, topicConfig)) {
      return; // Skip this subscriber
    }

    // Apply transformations
    const transformedContent = this.applyTransformations(
      content,
      topicConfig.transformations
    );

    // Publish message
    const message = {
      data: Buffer.from(JSON.stringify(transformedContent)),
      attributes: {
        dataProductId: subscription.dataProductId,
        scraperId: content.scraperId,
        runId: runId,
        timestamp: new Date().toISOString(),
        customerId: subscription.customerId,
      }
    };

    await topic.publishMessage(message);

    // Update usage tracking
    await this.trackUsage(subscription.id, 'pubsub_message');
  }

  private matchesFilters(content: any, topicConfig: any): boolean {
    // Tag filtering
    if (topicConfig.filterTags && topicConfig.filterTags.length > 0) {
      const contentTags = content.tags || [];
      const hasMatchingTag = topicConfig.filterTags.some((tag: string) =>
        contentTags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Keyword filtering
    if (topicConfig.filters?.keywords) {
      const text = JSON.stringify(content).toLowerCase();
      const hasKeyword = topicConfig.filters.keywords.some((kw: string) =>
        text.includes(kw.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    return true;
  }

  private applyTransformations(content: any, transformations?: any) {
    if (!transformations) return content;

    let result = { ...content };

    // Field selection
    if (transformations.fields) {
      result = Object.fromEntries(
        Object.entries(result).filter(([key]) =>
          transformations.fields.includes(key)
        )
      );
    }

    // Remove vectors if not wanted
    if (!transformations.includeVectors) {
      delete result.embedding;
      delete result.vectorId;
    }

    // Remove raw HTML if not wanted
    if (!transformations.includeRawHtml) {
      delete result.rawHtml;
      delete result.htmlPath;
    }

    return result;
  }

  private async trackUsage(subscriptionId: string, type: string) {
    // Increment usage counter (for billing)
    await firestore.collection('data_subscriptions').doc(subscriptionId).update({
      'currentPeriod.pubsubMessages': admin.firestore.FieldValue.increment(1),
      lastAccessedAt: new Date(),
    });
  }
}
```

---

## 🔌 Auto-Generated MCP Servers

### MCP Server Generator

**File:** `src/lib/mcp-generator.ts`

```typescript
/**
 * Auto-generate MCP server for a data product
 */
export async function generateMCPServerForProduct(
  productId: string,
  customerId: string
): Promise<MCPServerConfig> {
  const product = await getDataProduct(productId);
  const subscription = await getSubscription(productId, customerId);

  // Generate server ID
  const serverId = `mcp-${productId}-${customerId}`;

  // Generate API key
  const apiKey = generateSecureAPIKey();

  // Create MCP server config
  const mcpServer: MCPServerConfig = {
    id: serverId,
    name: `${product.name} - ${customerId}`,
    type: 'data-product',
    dataProductId: productId,
    customerId: customerId,
    
    // Resources (auto-generated from schema)
    resources: [
      {
        uri: `flow-data://${productId}/latest`,
        name: `${product.name} - Latest Records`,
        description: `Access the most recent records from ${product.name}`,
        mimeType: 'application/json',
        schema: product.dataSchema,
      },
      {
        uri: `flow-data://${productId}/search`,
        name: `${product.name} - Semantic Search`,
        description: `Perform semantic search across ${product.name}`,
        mimeType: 'application/json',
        schema: {
          input: { query: 'string', limit: 'number' },
          output: { results: 'array' }
        }
      },
      {
        uri: `flow-data://${productId}/stats`,
        name: `${product.name} - Statistics`,
        description: `Get statistics and metadata for ${product.name}`,
        mimeType: 'application/json',
      }
    ],
    
    // Authentication
    apiKeys: [{
      id: `key-${Date.now()}`,
      keyHash: hashAPIKey(apiKey),
      customerId: customerId,
      createdAt: new Date(),
      expiresAt: null,
      isActive: true,
    }],
    
    // Rate limits (based on tier)
    rateLimits: {
      requestsPerMinute: subscription.tier === 'enterprise' ? 1000 : 100,
      requestsPerDay: subscription.tier === 'enterprise' ? 100000 : 10000,
    },
    
    // Metadata
    createdAt: new Date(),
    createdBy: 'auto-generated',
    version: '1.0.0',
  };

  // Save to Firestore
  await firestore.collection('mcp_servers').doc(serverId).set(mcpServer);

  // Update subscription with MCP details
  await firestore.collection('data_subscriptions').doc(subscription.id).update({
    'mcpServer.serverId': serverId,
    'mcpServer.apiKey': apiKey, // Send to customer once, then hash
    'mcpServer.serverUrl': `https://api.flow.ai/mcp/${serverId}`,
  });

  return mcpServer;
}
```

---

## 📦 Auto-Generated npm SDK

### SDK Generator

**File:** `src/lib/sdk-generator.ts`

```typescript
/**
 * Auto-generate npm SDK for a data product
 */
export async function generateNPMSDKForProduct(
  productId: string,
  customerId: string
): Promise<{ packageName: string; code: string }> {
  const product = await getDataProduct(productId);
  const subscription = await getSubscription(productId, customerId);

  const packageName = `@flow-data/${productId}`;

  // Generate TypeScript SDK code
  const sdkCode = `
/**
 * ${product.name} - Flow Data SDK
 * Auto-generated on ${new Date().toISOString()}
 */

export interface ${toPascalCase(productId)}Record {
  ${Object.entries(product.dataSchema.properties || {})
    .map(([key, schema]) => `${key}: ${mapTypeScriptType(schema)};`)
    .join('\n  ')}
}

export interface SearchOptions {
  query: string;
  limit?: number;
  filters?: {
    tags?: string[];
    dateRange?: { from: Date; to?: Date };
  };
}

export class ${toPascalCase(productId)}Client {
  private apiKey: string;
  private baseUrl: string = 'https://api.flow.ai/datasets/${productId}';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get latest records
   */
  async getLatest(limit: number = 100): Promise<${toPascalCase(productId)}Record[]> {
    const response = await fetch(\`\${this.baseUrl}/latest?limit=\${limit}\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
    });
    
    if (!response.ok) {
      throw new Error(\`API error: \${response.status}\`);
    }
    
    const data = await response.json();
    return data.records;
  }

  /**
   * Semantic search
   */
  async search(options: SearchOptions): Promise<${toPascalCase(productId)}Record[]> {
    const response = await fetch(\`\${this.baseUrl}/search\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(\`Search error: \${response.status}\`);
    }
    
    const data = await response.json();
    return data.results;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    const response = await fetch(\`\${this.baseUrl}/stats\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
    });
    
    if (!response.ok) {
      throw new Error(\`Stats error: \${response.status}\`);
    }
    
    return await response.json();
  }

  /**
   * Subscribe to updates (via Pub/Sub)
   */
  async subscribe(callback: (record: ${toPascalCase(productId)}Record) => void): Promise<void> {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(\`wss://api.flow.ai/datasets/${productId}/stream\`);
    
    ws.onmessage = (event) => {
      const record = JSON.parse(event.data);
      callback(record);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
}

export default ${toPascalCase(productId)}Client;
`;

  // Generate package.json
  const packageJson = {
    name: packageName,
    version: '1.0.0',
    description: product.description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    keywords: product.tags,
    author: 'AI Factory',
    license: 'PROPRIETARY',
    repository: {
      type: 'git',
      url: `https://github.com/ai-factory/${productId}-sdk`
    },
    scripts: {
      build: 'tsc',
      test: 'jest',
      prepublishOnly: 'npm run build'
    },
    dependencies: {
      'node-fetch': '^3.3.0'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0'
    }
  };

  // Publish to private npm registry (or GitHub packages)
  await publishToNPMRegistry(packageName, sdkCode, packageJson, subscription);

  return {
    packageName,
    code: sdkCode
  };
}

function toPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (match) =>
    match.replace('-', '').toUpperCase()
  );
}

function mapTypeScriptType(schema: any): string {
  if (schema.type === 'string') return 'string';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return `${mapTypeScriptType(schema.items)}[]`;
  if (schema.type === 'object') return 'Record<string, any>';
  return 'any';
}
```

---

## 🌐 Marketplace UI (Customer-Facing)

### Data Marketplace Page

**File:** `src/pages/marketplace.astro`

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Flow Data Marketplace">
  <div class="min-h-screen bg-slate-50">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
      <div class="max-w-7xl mx-auto px-6">
        <h1 class="text-5xl font-bold mb-4">
          Flow Data Marketplace
        </h1>
        <p class="text-xl text-blue-100 mb-8">
          Curated, domain-specific datasets ready for your AI applications
        </p>
        <div class="flex gap-4">
          <button class="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold">
            Browse Datasets
          </button>
          <button class="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold">
            For Developers
          </button>
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div class="max-w-7xl mx-auto px-6 py-12">
      <h2 class="text-3xl font-bold mb-8">Popular Categories</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <CategoryCard icon="⚖️" title="Legal & Regulatory" count={12} />
        <CategoryCard icon="🏗️" title="Construction & Infrastructure" count={8} />
        <CategoryCard icon="💼" title="Business & Finance" count={15} />
        <CategoryCard icon="🏛️" title="Government & Policy" count={9} />
      </div>
    </div>

    <!-- Featured Datasets -->
    <div class="max-w-7xl mx-auto px-6 py-12">
      <h2 class="text-3xl font-bold mb-8">Featured Datasets</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Will be populated dynamically -->
      </div>
    </div>
  </div>
</Layout>
```

### Dataset Detail Page

```typescript
export function DatasetDetailPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<DataProduct | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{product?.name}</h1>
            <p className="text-xl text-slate-600">{product?.description}</p>
            <div className="flex gap-3 mt-4">
              {product?.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Starting at</p>
            <p className="text-4xl font-bold text-blue-600">
              ${product?.pricingTiers.basic.price}
              <span className="text-lg text-slate-600">/month</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <StatCard label="Total Records" value={product?.recordCount.toLocaleString()} />
        <StatCard label="Update Frequency" value={product?.updateFrequency} />
        <StatCard label="Data Freshness" value={product?.dataFreshness} />
        <StatCard label="Quality Score" value={`${product?.qualityScore}/100`} />
      </div>

      {/* Access Methods */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Access Methods</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AccessMethodCard
            icon="🔌"
            title="MCP Server"
            description="Cursor AI-ready"
            available={product?.accessMethods.mcpServer.enabled}
          />
          <AccessMethodCard
            icon="📦"
            title="npm SDK"
            description="Developer-friendly"
            available={product?.accessMethods.npmSdk.enabled}
            badge={product?.accessMethods.npmSdk.packageName}
          />
          <AccessMethodCard
            icon="🌐"
            title="REST API"
            description="Universal access"
            available={product?.accessMethods.restApi.enabled}
          />
          <AccessMethodCard
            icon="📡"
            title="Pub/Sub Stream"
            description="Real-time updates"
            available={product?.accessMethods.pubsub.enabled}
          />
        </div>
      </div>

      {/* Sample Data */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Sample Data</h2>
        <div className="bg-slate-900 rounded-lg p-6">
          <pre className="text-sm text-green-400 overflow-x-auto">
            {JSON.stringify(product?.sampleData[0], null, 2)}
          </pre>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Pricing Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard tier="basic" product={product} />
          <PricingCard tier="professional" product={product} featured />
          <PricingCard tier="enterprise" product={product} />
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
        <p className="text-slate-600 mb-6">
          Subscribe to {product?.name} and start building in minutes
        </p>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg">
          Subscribe Now
        </button>
      </div>
    </div>
  );
}
```

---

## 💳 Billing Integration

### Stripe Subscription Management

**File:** `src/lib/billing.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export async function createDataSubscription(
  customerId: string,
  productId: string,
  tier: 'basic' | 'professional' | 'enterprise',
  accessMethods: string[]
): Promise<DataSubscription> {
  const product = await getDataProduct(productId);
  const pricing = product.pricingTiers[tier];

  // Create Stripe subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: customerId, // Stripe customer ID
    items: [{
      price_data: {
        currency: 'usd',
        product: product.id,
        recurring: {
          interval: 'month'
        },
        unit_amount: pricing.price * 100, // Convert to cents
      }
    }],
    metadata: {
      dataProductId: productId,
      tier: tier,
      accessMethods: accessMethods.join(',')
    }
  });

  // Create Flow subscription record
  const subscriptionRef = await firestore.collection('data_subscriptions').add({
    customerId: customerId,
    dataProductId: productId,
    tier: tier,
    accessMethods: accessMethods,
    status: 'active',
    stripeSubscriptionId: stripeSubscription.id,
    pricePerMonth: pricing.price,
    nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
    currentPeriod: {
      apiRequests: 0,
      vectorSearches: 0,
      pubsubMessages: 0,
      cost: 0,
    },
    createdAt: new Date(),
    createdBy: customerId,
  });

  // Auto-generate access methods
  if (accessMethods.includes('mcp')) {
    await generateMCPServerForProduct(productId, customerId);
  }

  if (accessMethods.includes('npm')) {
    await generateNPMSDKForProduct(productId, customerId);
  }

  if (accessMethods.includes('pubsub')) {
    await createPubSubTopicForSubscription(subscriptionRef.id);
  }

  return {
    id: subscriptionRef.id,
    ...subscriptionRef.data()
  } as DataSubscription;
}

/**
 * Track usage for billing
 */
export async function trackDataUsage(
  subscriptionId: string,
  usageType: 'api_request' | 'vector_search' | 'pubsub_message',
  quantity: number = 1
) {
  const fieldMap = {
    'api_request': 'currentPeriod.apiRequests',
    'vector_search': 'currentPeriod.vectorSearches',
    'pubsub_message': 'currentPeriod.pubsubMessages',
  };

  await firestore.collection('data_subscriptions').doc(subscriptionId).update({
    [fieldMap[usageType]]: admin.firestore.FieldValue.increment(quantity),
    lastAccessedAt: new Date(),
  });

  // Calculate overage costs (if beyond tier limits)
  const subscription = await getSubscription(subscriptionId);
  await calculateOverageCosts(subscription);
}
```

---

## 🎯 Example: Construction Company Use Case

### Scenario

**Company:** Salfa Corp (construction)  
**Need:** Track all congressional projects related to infrastructure, permits, regulations  
**Budget:** $299/month  
**Requirements:** Daily updates, semantic search, Cursor integration

### Implementation

**Step 1: SuperAdmin Configuration (SCRAPPY Settings)**

```typescript
// Create data product
const congresoInfraProduct = {
  id: 'congreso-infraestructura',
  name: 'Chilean Infrastructure Legislation',
  category: 'legal',
  description: 'All congressional projects related to infrastructure, construction, permits, and regulations. Updated daily.',
  
  // Auto-configured scrapers
  scra perIds: [
    'scraper-congreso-infraestructura-1',
    'scraper-congreso-infraestructura-2',
  ],
  
  updateFrequency: 'daily',
  
  // Access methods enabled
  accessMethods: {
    mcpServer: { enabled: true },
    npmSdk: { enabled: true, packageName: '@flow/congreso-infra' },
    restApi: { enabled: true },
    pubsub: { enabled: true },
  },
  
  // Pricing
  pricingTiers: {
    professional: {
      price: 299,
      limits: {
        apiRequests: 100000,
        vectorSearches: 10000,
        pubsubMessages: 'unlimited',
      }
    }
  },
  
  tags: ['congreso', 'infraestructura', 'construccion', 'permisos'],
};
```

**Step 2: Salfa Corp Subscribes**

```typescript
// From marketplace UI, Salfa admin clicks "Subscribe"
// Selects: Professional tier
// Access methods: MCP + Pub/Sub (daily batch)

// System automatically:
// 1. Creates Stripe subscription
// 2. Generates MCP server with API key
// 3. Creates Pub/Sub topic: flow-data-congreso-infra-salfa-corp
// 4. Configures daily delivery at 8 AM
// 5. Sends welcome email with:
//    - MCP server URL + API key
//    - npm SDK install instructions
//    - API documentation link
//    - Pub/Sub topic name
```

**Step 3: Salfa Uses the Data**

**Option A: Via Cursor AI (MCP)**
```json
// .cursorrules in Salfa's project
{
  "mcp": {
    "servers": {
      "congreso-infra": {
        "type": "flow-data",
        "url": "https://api.flow.ai/mcp/mcp-congreso-infra-salfa-corp",
        "apiKey": "mcp_prod_abc123..."
      }
    }
  }
}
```

**Option B: Via npm SDK**
```typescript
// In Salfa's codebase
import CongresoInfraClient from '@flow/congreso-infra';

const client = new CongresoInfraClient(process.env.FLOW_API_KEY);

// Search for relevant projects
const projects = await client.search({
  query: 'permiso construcción edificios altura',
  limit: 10,
  filters: {
    tags: ['permisos'],
    dateRange: { from: new Date('2024-01-01') }
  }
});

// Use in their app
projects.forEach(project => {
  console.log(`📋 ${project.title}`);
  console.log(`   Estado: ${project.estado}`);
  console.log(`   Fecha: ${project.fecha}`);
});
```

**Option C: Via Pub/Sub (Automated Daily)**
```typescript
// Salfa's Cloud Function receives daily batch
export async function processCongresoUpdates(message: PubSubMessage) {
  const data = JSON.parse(Buffer.from(message.data).toString());
  
  // Auto-analyze new/updated projects
  for (const project of data.records) {
    // Check if impacts Salfa's projects
    const impact = await analyzeImpact(project);
    
    if (impact.relevant) {
      // Create agent with this specific project context
      await createProjectAgent(project);
      
      // Notify relevant teams
      await notifyTeams(impact.teams, project);
    }
  }
}
```

**Step 4: Automatic Updates**

```
Every day at 8 AM:
  ↓
Scraper runs → Extracts new projects
  ↓
Detects: 3 new infrastructure projects
  ↓
Vectorizes new content
  ↓
Publishes to Salfa's Pub/Sub topic
  ↓
Salfa's Cloud Function processes
  ↓
Creates 3 new agents automatically
  ↓
Salfa users see new agents in sidebar
```

**Result:** Salfa stays updated on ALL relevant legislation without manual work.

---

## 📈 Revenue Projections

### Example Dataset: Congreso Infrastructure

**Assumptions:**
- 50 construction companies in Chile
- Conversion rate: 20% subscribe
- Average tier: Professional ($299/month)

**Calculation:**
```
Subscribers: 50 × 20% = 10 companies
MRR per dataset: 10 × $299 = $2,990
ARR per dataset: $2,990 × 12 = $35,880
```

**10 datasets:**
```
Total MRR: $29,900
Total ARR: $358,800
```

**Add enterprise tier** (5% of subscribers at $1,499):
```
Enterprise MRR: 10 × 5% × $1,499 = $750
Total MRR: $30,650
Total ARR: $367,800
```

**With usage-based add-ons** (vector searches, custom scrapers):
```
Estimated additional 30% = $110,000/year
Total ARR: ~$478,000
```

---

## 🔐 Multi-Tenant Data Isolation

### Customer Data Separation

```typescript
// Each customer's subscription creates isolated resources:

// 1. Dedicated Pub/Sub topic
const topicName = `flow-data-${productId}-${customerId}`;

// 2. Customer-specific MCP server
const mcpServerId = `mcp-${productId}-${customerId}`;

// 3. Customer-specific API key (scoped to their data only)
const apiKey = `flow_${customerId}_${generateSecure()}`;

// 4. Firestore data filtered by customer
.where('customerId', '==', customerId)
.where('subscriptionStatus', '==', 'active')

// 5. BigQuery views (customer-specific)
CREATE VIEW `salfagpt.customer_${customerId}.congreso_projects` AS
SELECT * FROM `salfagpt.datasets.congreso_projects`
WHERE subscriberId = '${customerId}';
```

### Security Rules

```javascript
// firestore.rules
match /data_subscriptions/{subscriptionId} {
  // Customers can only read their own subscriptions
  allow read: if request.auth != null && 
              (resource.data.customerId == request.auth.uid ||
               isSuperAdmin());
  
  // Only SuperAdmin can create/modify subscriptions
  allow write: if isSuperAdmin();
}

match /data_products/{productId} {
  // Anyone can browse marketplace
  allow read: if true;
  
  // Only SuperAdmin can manage products
  allow write: if isSuperAdmin();
}
```

---

## 📊 SuperAdmin Analytics Dashboard

### Revenue & Usage Analytics

**Component:** `src/components/admin/MarketplaceAnalytics.tsx`

```typescript
export function MarketplaceAnalyticsDashboard() {
  return (
    <div className="space-y-8">
      {/* Revenue Overview */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          label="Monthly Recurring Revenue"
          value={`$${mrr.toLocaleString()}`}
          change="+12%"
          trend="up"
        />
        <MetricCard
          label="Active Subscriptions"
          value={activeSubscriptions}
          change="+8"
          trend="up"
        />
        <MetricCard
          label="Total Datasets"
          value={totalDatasets}
        />
        <MetricCard
          label="Avg Revenue per Dataset"
          value={`$${avgRevenuePerDataset.toLocaleString()}`}
        />
      </div>

      {/* Top Performing Datasets */}
      <div>
        <h2 className="text-xl font-bold mb-4">Top Performing Datasets</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Dataset</th>
              <th className="px-4 py-3 text-right">Subscribers</th>
              <th className="px-4 py-3 text-right">MRR</th>
              <th className="px-4 py-3 text-right">API Calls</th>
              <th className="px-4 py-3 text-right">Quality</th>
            </tr>
          </thead>
          <tbody>
            {topDatasets.map(dataset => (
              <tr key={dataset.id} className="border-b">
                <td className="px-4 py-3 font-medium">{dataset.name}</td>
                <td className="px-4 py-3 text-right">{dataset.activeSubscriptions}</td>
                <td className="px-4 py-3 text-right text-green-600 font-bold">
                  ${dataset.monthlyRevenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {dataset.apiCallsThisMonth.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    {dataset.qualityScore}/100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scraper Performance */}
      <div>
        <h2 className="text-xl font-bold mb-4">Scraper Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scrapers.map(scraper => (
            <ScraperPerformanceCard key={scraper.id} scraper={scraper} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Complete End-to-End Flow

### From Scraper Configuration to Customer Revenue

```
1. SUPPLY (SuperAdmin in SCRAPPY Settings)
   ─────────────────────────────────────────
   SuperAdmin configures scraper:
   - URL: https://congreso.cl/proyectos?tema=infraestructura
   - Frequency: Daily at 6 AM
   - Tags: #congreso, #infraestructura, #construccion
   
   ↓

2. AUTOMATED SCRAPING
   ─────────────────────────────────────────
   Daily at 6 AM:
   - Puppeteer scrapes new projects
   - Gemini extracts clean text
   - BigQuery GREEN vectorizes
   - Pub/Sub publishes to topics
   - MCP servers updated
   - npm SDK data refreshed
   
   ↓

3. PRODUCT MANAGEMENT (SuperAdmin)
   ─────────────────────────────────────────
   SuperAdmin creates data product:
   - Name: "Chilean Infrastructure Legislation"
   - Category: Legal & Government
   - Pricing: $49 (Basic), $299 (Pro), $1,499 (Enterprise)
   - Access: MCP + npm + API + Pub/Sub
   - Quality certified: ✅
   
   ↓

4. MARKETPLACE (Customer Discovery)
   ─────────────────────────────────────────
   Construction company browses marketplace:
   - Finds "Chilean Infrastructure Legislation"
   - Reviews sample data
   - Sees 1,245 projects, daily updates
   - Reads documentation
   - Compares pricing tiers
   
   ↓

5. SUBSCRIPTION (Customer Purchase)
   ─────────────────────────────────────────
   Company subscribes (Professional tier):
   - Enters payment info (Stripe)
   - Selects access methods: MCP + Pub/Sub
   - Configures delivery: Daily at 8 AM
   - Filter tags: #permisos, #construccion
   
   ↓

6. AUTO-PROVISIONING (Platform)
   ─────────────────────────────────────────
   Within 60 seconds:
   - ✅ Stripe subscription created
   - ✅ MCP server generated + API key
   - ✅ Pub/Sub topic created
   - ✅ Daily delivery scheduled
   - ✅ Welcome email sent with:
       - MCP server URL + API key
       - Pub/Sub topic name
       - Quick start guide
       - Support contact
   
   ↓

7. CUSTOMER USAGE
   ─────────────────────────────────────────
   Company integrates in 3 ways:
   
   A) Cursor AI (Immediate)
      - Add MCP server to .cursorrules
      - Ask: "What new infrastructure projects were introduced this week?"
      - Cursor queries via MCP → Instant answers
   
   B) npm SDK (Development)
      - npm install @flow/congreso-infra
      - Build internal dashboard
      - Semantic search for relevant projects
   
   C) Pub/Sub (Automated)
      - Cloud Function receives daily batch
      - Auto-creates agents for relevant projects
      - Notifies project managers
   
   ↓

8. ONGOING VALUE
   ─────────────────────────────────────────
   Every day:
   - New projects scraped at 6 AM
   - Vectorized and published
   - Delivered to customer at 8 AM
   - Customer's systems updated automatically
   
   Monthly billing:
   - Base: $299
   - Vector searches: 1,200 × $0.10/1000 = $0.12
   - Total: $299.12
   
   Customer saves:
   - 20 hours/month manual monitoring
   - $2,000/month (junior analyst salary)
   - Catches 100% of relevant projects (vs 60% manual)
   
   ROI: 10x
```

---

## 🏪 Data Marketplace Features

### Browse & Discovery

```typescript
// Marketplace page with filters
interface MarketplaceFilters {
  categories: string[];                 // legal, finance, construction, etc
  updateFrequency: string[];            // real-time, daily, weekly
  priceRange: { min: number; max: number };
  accessMethods: string[];              // mcp, npm, api, pubsub
  certified: boolean;                   // Only certified datasets
  minQualityScore: number;              // 0-100
}

// Search
interface MarketplaceSearch {
  query: string;                        // "construction permits chile"
  semantic: boolean;                    // Use vector search
  sortBy: 'relevance' | 'popular' | 'newest' | 'price';
}
```

### Dataset Preview

Before subscribing, customers can:
- ✅ View sample data (3-5 records)
- ✅ See update frequency
- ✅ Check data freshness
- ✅ Read schema documentation
- ✅ View usage examples
- ✅ See customer reviews (future)
- ✅ Try with limited free trial (future)

---

## 🔧 Technical Implementation

### Auto-Generate MCP Server Config

```typescript
// When subscription created, generate cursor config for customer
export function generateCursorConfig(subscription: DataSubscription): string {
  const product = getDataProduct(subscription.dataProductId);
  
  return `
# Add this to your .cursorrules file

{
  "mcp": {
    "servers": {
      "${product.id}": {
        "type": "flow-data",
        "url": "${subscription.mcpServer!.serverUrl}",
        "apiKey": "${subscription.mcpServer!.apiKey}",
        "description": "${product.description}",
        "resources": [
          "Latest records: ${product.id}://latest",
          "Semantic search: ${product.id}://search",
          "Statistics: ${product.id}://stats"
        ]
      }
    }
  }
}

# Usage in Cursor:
# Just ask: "What are the latest ${product.name.toLowerCase()} records?"
# Cursor will automatically query your MCP server.
`;
}
```

### Auto-Generate npm Package

```bash
# When subscription created with npm access:

# 1. Generate SDK code (see sdk-generator.ts)
# 2. Create GitHub repo: ai-factory/${productId}-sdk
# 3. Publish to npm (scoped package)
npm publish @flow-data/${productId}

# 4. Email customer:
"""
Your npm SDK is ready!

Install:
  npm install @flow-data/${productId}

Quick start:
  import Client from '@flow-data/${productId}';
  const client = new Client('${apiKey}');
  const data = await client.getLatest();

Full documentation: https://docs.flow.ai/sdks/${productId}
"""
```

---

## 💳 Billing & Usage Tracking

### Metered Billing

```typescript
interface UsageRecord {
  subscriptionId: string;
  customerId: string;
  dataProductId: string;
  
  // Usage type
  type: 'api_request' | 'vector_search' | 'pubsub_message' | 'mcp_query';
  
  // Metering
  quantity: number;
  unitPrice: number;                    // Per 1,000 requests
  totalCost: number;
  
  // Context
  endpoint?: string;
  method?: string;
  resourceUri?: string;
  
  timestamp: Date;
  billingPeriod: string;                // '2025-01'
}

// Track usage in real-time
export async function trackAPIUsage(
  subscriptionId: string,
  type: string,
  quantity: number = 1
) {
  const subscription = await getSubscription(subscriptionId);
  const tier = subscription.tier;
  const limits = getTierLimits(tier);

  // Check if within limits
  if (subscription.currentPeriod.apiRequests >= limits.apiRequests) {
    // Calculate overage cost
    const overage = quantity;
    const overageCost = overage * 0.01; // $0.01 per request over limit
    
    await firestore.collection('usage_records').add({
      subscriptionId,
      customerId: subscription.customerId,
      dataProductId: subscription.dataProductId,
      type: 'api_request_overage',
      quantity: overage,
      unitPrice: 0.01,
      totalCost: overageCost,
      timestamp: new Date(),
      billingPeriod: getCurrentBillingPeriod(),
    });
  }

  // Increment usage
  await firestore.collection('data_subscriptions').doc(subscriptionId).update({
    'currentPeriod.apiRequests': admin.firestore.FieldValue.increment(quantity),
    'currentPeriod.cost': admin.firestore.FieldValue.increment(0), // Or overage cost
  });
}
```

---

## 🎨 Customer Dashboard

### "My Subscriptions" Page

```typescript
export function MySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<DataSubscription[]>([]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">My Data Subscriptions</h1>

      <div className="space-y-6">
        {subscriptions.map(sub => (
          <div key={sub.id} className="border rounded-lg p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{getProductName(sub.dataProductId)}</h3>
                <p className="text-sm text-slate-600">
                  {sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1)} Plan
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                sub.status === 'active' ? 'bg-green-100 text-green-700' :
                sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {sub.status}
              </span>
            </div>

            {/* Usage This Period */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-500">API Requests</p>
                <p className="text-lg font-bold">{sub.currentPeriod.apiRequests.toLocaleString()}</p>
                <p className="text-xs text-slate-400">of 100,000</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Vector Searches</p>
                <p className="text-lg font-bold">{sub.currentPeriod.vectorSearches.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Pub/Sub Messages</p>
                <p className="text-lg font-bold">{sub.currentPeriod.pubsubMessages.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Cost</p>
                <p className="text-lg font-bold text-green-600">
                  ${sub.currentPeriod.cost.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Access Methods */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Access Methods:</p>
              <div className="flex gap-2">
                {sub.accessMethods.includes('mcp') && (
                  <AccessBadge icon="🔌" label="MCP Server" />
                )}
                {sub.accessMethods.includes('npm') && (
                  <AccessBadge icon="📦" label="npm SDK" />
                )}
                {sub.accessMethods.includes('api') && (
                  <AccessBadge icon="🌐" label="REST API" />
                )}
                {sub.accessMethods.includes('pubsub') && (
                  <AccessBadge icon="📡" label="Pub/Sub" />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                View Credentials
              </button>
              <button className="px-4 py-2 border rounded text-sm">
                Configure Delivery
              </button>
              <button className="px-4 py-2 border rounded text-sm">
                Documentation
              </button>
              <button className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm">
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Browse More Datasets */}
      <div className="mt-12 p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Need more data?</h3>
        <p className="text-slate-600 mb-4">
          Explore our marketplace with 50+ curated datasets
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
          Browse Marketplace
        </button>
      </div>
    </div>
  );
}
```

---

## 📚 Customer Onboarding

### Welcome Email Template

```html
Subject: Welcome to Flow Data - Your ${product.name} Dataset is Ready!

<div>
  <h1>🎉 Your subscription is active!</h1>
  
  <p>Thank you for subscribing to <strong>${product.name}</strong>.</p>
  
  <h2>Quick Start Guide</h2>
  
  <h3>🔌 Option 1: Use with Cursor AI (Instant)</h3>
  <p>Add this to your .cursorrules file:</p>
  <pre>${cursorConfig}</pre>
  <p>Then just ask Cursor: "What are the latest ${product.name.toLowerCase()} records?"</p>
  
  <h3>📦 Option 2: Use npm SDK (Development)</h3>
  <pre>npm install ${npmPackageName}</pre>
  <pre>
import Client from '${npmPackageName}';
const client = new Client('${apiKey}');
const data = await client.getLatest();
  </pre>
  
  <h3>📡 Option 3: Pub/Sub Stream (Automated)</h3>
  <p>Your daily batch will be delivered to:</p>
  <pre>Topic: ${pubsubTopicName}</pre>
  <p>Next delivery: Tomorrow at 8:00 AM</p>
  
  <h2>📖 Resources</h2>
  <ul>
    <li><a href="${docsUrl}">Full Documentation</a></li>
    <li><a href="${apiDocsUrl}">API Reference</a></li>
    <li><a href="${examplesUrl}">Code Examples</a></li>
    <li><a href="${supportUrl}">Support</a></li>
  </ul>
  
  <p>Questions? Reply to this email or contact ${supportEmail}</p>
</div>
```

---

## 📊 Data Model Extensions

### New Firestore Collections

```typescript
// data_products - Catalog of available datasets
{
  id: 'congreso-proyectos',
  name: 'Chilean Congressional Projects',
  category: 'legal',
  scr aperIds: ['scraper-1', 'scraper-2'],
  pricingTiers: {...},
  accessMethods: {...},
  ...
}

// data_subscriptions - Customer subscriptions
{
  id: 'sub-abc123',
  customerId: 'org-salfa-corp',
  dataProductId: 'congreso-proyectos',
  tier: 'professional',
  status: 'active',
  mcpServer: {...},
  pubsubConfig: {...},
  currentPeriod: {...},
  ...
}

// usage_records - Metered billing
{
  subscriptionId: 'sub-abc123',
  type: 'vector_search',
  quantity: 1,
  totalCost: 0.0001,
  timestamp: Date,
  ...
}

// pubsub_topics - Customer delivery topics
{
  topicName: 'flow-data-congreso-salfa',
  subscriptionId: 'sub-abc123',
  frequency: 'daily',
  filters: {...},
  ...
}

// mcp_servers (extended for data products)
{
  id: 'mcp-congreso-salfa',
  type: 'data-product',
  dataProductId: 'congreso-proyectos',
  customerId: 'org-salfa-corp',
  resources: [...],
  ...
}
```

---

## ✅ Implementation Priority

### Phase 1: Core Infrastructure (Week 1-2)
- ✅ Scraper system (already designed)
- ✅ Data products collection
- ✅ Subscription model
- ✅ Basic billing (Stripe)

### Phase 2: Access Methods (Week 3-4)
- ✅ MCP server auto-generation
- ✅ npm SDK auto-generation
- ✅ REST API endpoints
- ✅ Pub/Sub publisher

### Phase 3: Marketplace (Week 5-6)
- ✅ Browse & discovery UI
- ✅ Dataset detail pages
- ✅ Subscription checkout
- ✅ Customer dashboard

### Phase 4: Analytics & Optimization (Week 7-8)
- ✅ Revenue analytics
- ✅ Usage tracking
- ✅ Quality metrics
- ✅ Customer success monitoring

---

## 🎯 Business Model Summary

**Value Proposition:**
> "Stop building scrapers. Start building AI apps."

**Target Customers:**
1. **Enterprises** needing domain-specific data (Salfa, law firms, banks)
2. **AI Developers** building specialized apps (legal AI, construction AI)
3. **Research Institutions** needing structured datasets

**Revenue Streams:**
1. **Subscription fees** ($49-$1,499/month per dataset)
2. **Usage-based billing** (vector searches, API overages)
3. **Custom scraper setup** ($500 setup + $99/month)
4. **Enterprise white-label** ($2,000+/month)

**Unit Economics (per dataset):**
```
Cost to operate:
- Scraping: $20/month (Cloud Run + Puppeteer)
- Storage: $10/month (GCS + BigQuery)
- Vectorization: $30/month (Gemini + BigQuery GREEN)
- Support: $40/month (amortized)
Total cost: $100/month per dataset

Average revenue:
- 10 subscribers × $299 = $2,990/month
- Gross margin: ($2,990 - $100) / $2,990 = 97%
```

**Scalability:**
- 10 datasets × 10 avg subscribers = $29,900 MRR ($358,800 ARR)
- 50 datasets × 20 avg subscribers = $298,000 MRR ($3.58M ARR)
- 100 datasets × 50 avg subscribers = $1.49M MRR ($17.9M ARR)

---

## 🚀 Next Steps

Ready to implement this marketplace. Should I:

1. **Build data product schema** - Complete TypeScript types
2. **Create SCRAPPY settings UI** - SuperAdmin panel
3. **Implement subscription system** - Stripe + access provisioning
4. **Build MCP auto-generation** - Per-customer MCP servers
5. **Create marketplace UI** - Customer-facing browse & subscribe
6. **Build Pub/Sub publisher** - Automated delivery system

**Recommend:** Start with data product schema → subscription system → MCP generation → marketplace UI

This creates a complete B2B SaaS business built on automated scrapers. Sound good?


