import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import {
  type Email,
  type InsertEmail,
  type EmailAccount,
  type InsertEmailAccount,
  type EmailWithAccount,
  type KnowledgeBase,
  type InsertKnowledgeBase
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

// MongoDB document types (with _id field)
interface EmailAccountDoc extends Omit<EmailAccount, 'id'> {
  _id: string;
}

interface EmailDoc extends Omit<Email, 'id'> {
  _id: string;
}

interface KnowledgeBaseDoc extends Omit<KnowledgeBase, 'id'> {
  _id: string;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db | null = null;
  private accountsCollection: Collection<EmailAccountDoc> | null = null;
  private emailsCollection: Collection<EmailDoc> | null = null;
  private knowledgeCollection: Collection<KnowledgeBaseDoc> | null = null;

  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db('onebox');
      this.accountsCollection = this.db.collection<EmailAccountDoc>('accounts');
      this.emailsCollection = this.db.collection<EmailDoc>('emails');
      this.knowledgeCollection = this.db.collection<KnowledgeBaseDoc>('knowledge');

      // Create indexes for better performance
      await this.accountsCollection.createIndex({ email: 1 }, { unique: true });
      await this.emailsCollection.createIndex({ accountId: 1 });
      await this.emailsCollection.createIndex({ messageId: 1, accountId: 1 }, { unique: true });
      
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  // Helper to convert MongoDB doc to domain model
  private toEmailAccount(doc: EmailAccountDoc): EmailAccount {
    return {
      id: doc._id,
      email: doc.email,
      imapHost: doc.imapHost,
      imapPort: doc.imapPort,
      imapUser: doc.imapUser,
      imapPassword: doc.imapPassword,
      isActive: doc.isActive,
      lastSyncedAt: doc.lastSyncedAt,
      createdAt: doc.createdAt,
    };
  }

  private toEmail(doc: EmailDoc): Email {
    return {
      id: doc._id,
      accountId: doc.accountId,
      messageId: doc.messageId,
      from: doc.from,
      to: doc.to,
      subject: doc.subject,
      bodyText: doc.bodyText,
      bodyHtml: doc.bodyHtml,
      folder: doc.folder,
      category: doc.category,
      isRead: doc.isRead,
      hasAttachments: doc.hasAttachments,
      receivedAt: doc.receivedAt,
      createdAt: doc.createdAt,
    };
  }

  private toKnowledgeBase(doc: KnowledgeBaseDoc): KnowledgeBase {
    return {
      id: doc._id,
      content: doc.content,
      category: doc.category,
      embedding: doc.embedding,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // Email Accounts
  async getAccount(id: string): Promise<EmailAccount | undefined> {
    if (!this.accountsCollection) throw new Error('Not connected to MongoDB');
    const doc = await this.accountsCollection.findOne({ _id: id });
    return doc ? this.toEmailAccount(doc) : undefined;
  }

  async getAccountByEmail(email: string): Promise<EmailAccount | undefined> {
    if (!this.accountsCollection) throw new Error('Not connected to MongoDB');
    const doc = await this.accountsCollection.findOne({ email });
    return doc ? this.toEmailAccount(doc) : undefined;
  }

  async getAllAccounts(): Promise<EmailAccount[]> {
    if (!this.accountsCollection) throw new Error('Not connected to MongoDB');
    const docs = await this.accountsCollection.find({}).toArray();
    return docs.map(doc => this.toEmailAccount(doc));
  }

  async createAccount(insertAccount: InsertEmailAccount): Promise<EmailAccount> {
    if (!this.accountsCollection) throw new Error('Not connected to MongoDB');
    
    const id = randomUUID();
    const accountDoc: EmailAccountDoc = {
      _id: id,
      email: insertAccount.email,
      imapHost: insertAccount.imapHost,
      imapPort: insertAccount.imapPort ?? 993,
      imapUser: insertAccount.imapUser,
      imapPassword: insertAccount.imapPassword,
      isActive: true,
      lastSyncedAt: null,
      createdAt: new Date(),
    };

    await this.accountsCollection.insertOne(accountDoc);
    return this.toEmailAccount(accountDoc);
  }

  async updateAccountSyncTime(id: string): Promise<void> {
    if (!this.accountsCollection) throw new Error('Not connected to MongoDB');
    await this.accountsCollection.updateOne(
      { _id: id },
      { $set: { lastSyncedAt: new Date() } }
    );
  }

  async deleteAccount(id: string): Promise<boolean> {
    if (!this.accountsCollection) throw new Error('Not connected to MongoDB');
    
    const result = await this.accountsCollection.deleteOne({ _id: id });
    if (result.deletedCount > 0) {
      await this.deleteEmailsByAccount(id);
      return true;
    }
    return false;
  }

  // Emails
  async getEmail(id: string): Promise<Email | undefined> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    const doc = await this.emailsCollection.findOne({ _id: id });
    return doc ? this.toEmail(doc) : undefined;
  }

  async getEmailByMessageId(messageId: string, accountId: string): Promise<Email | undefined> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    const doc = await this.emailsCollection.findOne({ messageId, accountId });
    return doc ? this.toEmail(doc) : undefined;
  }

  async getAllEmails(): Promise<EmailWithAccount[]> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    
    const docs = await this.emailsCollection.find({}).toArray();
    const emails = await Promise.all(
      docs.map(async (doc) => {
        const account = await this.getAccount(doc.accountId);
        return {
          ...this.toEmail(doc),
          accountEmail: account?.email || "Unknown",
        };
      })
    );
    return emails;
  }

  async getEmailsByAccount(accountId: string): Promise<Email[]> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    const docs = await this.emailsCollection.find({ accountId }).toArray();
    return docs.map(doc => this.toEmail(doc));
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    
    const id = randomUUID();
    const emailDoc: EmailDoc = {
      _id: id,
      accountId: insertEmail.accountId,
      messageId: insertEmail.messageId,
      from: insertEmail.from,
      to: insertEmail.to,
      subject: insertEmail.subject,
      bodyText: insertEmail.bodyText ?? null,
      bodyHtml: insertEmail.bodyHtml ?? null,
      folder: insertEmail.folder ?? "INBOX",
      category: insertEmail.category ?? null,
      isRead: insertEmail.isRead ?? false,
      hasAttachments: insertEmail.hasAttachments ?? false,
      receivedAt: insertEmail.receivedAt,
      createdAt: new Date(),
    };

    try {
      await this.emailsCollection.insertOne(emailDoc);
    } catch (error: any) {
      // Handle duplicate key error (email already exists)
      if (error.code === 11000) {
        const existing = await this.getEmailByMessageId(insertEmail.messageId, insertEmail.accountId);
        if (existing) return existing;
      }
      throw error;
    }

    return this.toEmail(emailDoc);
  }

  async updateEmailCategory(id: string, category: string): Promise<Email | undefined> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    
    const result = await this.emailsCollection.findOneAndUpdate(
      { _id: id },
      { $set: { category } },
      { returnDocument: 'after' }
    );
    
    return result ? this.toEmail(result) : undefined;
  }

  async markEmailAsRead(id: string): Promise<Email | undefined> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    
    const result = await this.emailsCollection.findOneAndUpdate(
      { _id: id },
      { $set: { isRead: true } },
      { returnDocument: 'after' }
    );
    
    return result ? this.toEmail(result) : undefined;
  }

  async deleteEmailsByAccount(accountId: string): Promise<void> {
    if (!this.emailsCollection) throw new Error('Not connected to MongoDB');
    await this.emailsCollection.deleteMany({ accountId });
  }

  // Knowledge Base
  async getKnowledgeEntry(id: string): Promise<KnowledgeBase | undefined> {
    if (!this.knowledgeCollection) throw new Error('Not connected to MongoDB');
    const doc = await this.knowledgeCollection.findOne({ _id: id });
    return doc ? this.toKnowledgeBase(doc) : undefined;
  }

  async getAllKnowledgeEntries(): Promise<KnowledgeBase[]> {
    if (!this.knowledgeCollection) throw new Error('Not connected to MongoDB');
    const docs = await this.knowledgeCollection.find({}).toArray();
    return docs.map(doc => this.toKnowledgeBase(doc));
  }

  async createKnowledgeEntry(insertEntry: InsertKnowledgeBase, embedding: number[]): Promise<KnowledgeBase> {
    if (!this.knowledgeCollection) throw new Error('Not connected to MongoDB');
    
    const id = randomUUID();
    const entryDoc: KnowledgeBaseDoc = {
      _id: id,
      content: insertEntry.content,
      category: insertEntry.category ?? "general",
      embedding: JSON.stringify(embedding),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.knowledgeCollection.insertOne(entryDoc);
    return this.toKnowledgeBase(entryDoc);
  }

  async updateKnowledgeEntry(id: string, content: string, embedding: number[]): Promise<KnowledgeBase | undefined> {
    if (!this.knowledgeCollection) throw new Error('Not connected to MongoDB');
    
    const result = await this.knowledgeCollection.findOneAndUpdate(
      { _id: id },
      { 
        $set: { 
          content, 
          embedding: JSON.stringify(embedding),
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result ? this.toKnowledgeBase(result) : undefined;
  }

  async deleteKnowledgeEntry(id: string): Promise<boolean> {
    if (!this.knowledgeCollection) throw new Error('Not connected to MongoDB');
    const result = await this.knowledgeCollection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
