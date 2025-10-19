import { Client } from "@elastic/elasticsearch";

// Elasticsearch client configuration
const ELASTICSEARCH_ENABLED = process.env.ELASTICSEARCH_URL ? true : false;

export const esClient = ELASTICSEARCH_ENABLED
  ? new Client({
      node: process.env.ELASTICSEARCH_URL,
    })
  : null;

const INDEX_NAME = "emails";

// Check if Elasticsearch is available
async function isElasticsearchAvailable(): Promise<boolean> {
  if (!esClient) return false;
  
  try {
    await esClient.ping();
    return true;
  } catch {
    return false;
  }
}

// Initialize Elasticsearch index
export async function initializeElasticsearch() {
  if (!esClient) {
    console.log("Elasticsearch is not configured. Using in-memory search fallback.");
    return;
  }

  try {
    const available = await isElasticsearchAvailable();
    
    if (!available) {
      console.log("Elasticsearch is not available. Using in-memory search fallback.");
      return;
    }

    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (!indexExists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: "keyword" },
              accountId: { type: "keyword" },
              messageId: { type: "keyword" },
              from: { type: "text" },
              to: { type: "text" },
              subject: { type: "text" },
              bodyText: { type: "text" },
              bodyHtml: { type: "text" },
              folder: { type: "keyword" },
              category: { type: "keyword" },
              isRead: { type: "boolean" },
              hasAttachments: { type: "boolean" },
              receivedAt: { type: "date" },
              createdAt: { type: "date" },
            },
          },
        },
      });
      console.log(`Elasticsearch index "${INDEX_NAME}" created successfully`);
    } else {
      console.log(`Elasticsearch index "${INDEX_NAME}" already exists`);
    }
  } catch (error) {
    console.log("Elasticsearch connection failed. Using in-memory search fallback.");
  }
}

// Index an email in Elasticsearch
export async function indexEmail(email: any) {
  if (!esClient) return;
  
  try {
    const available = await isElasticsearchAvailable();
    if (!available) return;
    
    await esClient.index({
      index: INDEX_NAME,
      id: email.id,
      document: email,
    });
  } catch (error) {
    // Silently fail - fallback to in-memory search
  }
}

// Search emails in Elasticsearch
export async function searchEmails(filters: {
  query?: string;
  accountId?: string;
  folder?: string;
  category?: string;
  hasAttachments?: boolean;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
}) {
  if (!esClient) return [];
  
  try {
    const available = await isElasticsearchAvailable();
    if (!available) return [];
    
    const must: any[] = [];

    // Full-text search
    if (filters.query) {
      must.push({
        multi_match: {
          query: filters.query,
          fields: ["subject^2", "from", "to", "bodyText"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    // Filters
    if (filters.accountId) {
      must.push({ term: { accountId: filters.accountId } });
    }
    if (filters.folder) {
      must.push({ term: { folder: filters.folder } });
    }
    if (filters.category) {
      must.push({ term: { category: filters.category } });
    }
    if (filters.hasAttachments !== undefined) {
      must.push({ term: { hasAttachments: filters.hasAttachments } });
    }
    if (filters.isRead !== undefined) {
      must.push({ term: { isRead: filters.isRead } });
    }
    if (filters.dateFrom || filters.dateTo) {
      const range: any = {};
      if (filters.dateFrom) range.gte = filters.dateFrom;
      if (filters.dateTo) range.lte = filters.dateTo;
      must.push({ range: { receivedAt: range } });
    }

    const result = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: must.length > 0 ? { bool: { must } } : { match_all: {} },
        sort: [{ receivedAt: { order: "desc" } }],
        size: 100,
      },
    });

    return result.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    // Silently fail and return empty array - fallback to in-memory search
    return [];
  }
}

// Update email in Elasticsearch
export async function updateEmailInES(id: string, updates: any) {
  if (!esClient) return;
  
  try {
    const available = await isElasticsearchAvailable();
    if (!available) return;
    
    await esClient.update({
      index: INDEX_NAME,
      id,
      doc: updates,
    });
  } catch (error) {
    // Silently fail - fallback to in-memory search
  }
}
