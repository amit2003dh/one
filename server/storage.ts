import { 
  type Email, 
  type InsertEmail,
  type EmailAccount, 
  type InsertEmailAccount,
  type EmailWithAccount 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Email Accounts
  getAccount(id: string): Promise<EmailAccount | undefined>;
  getAccountByEmail(email: string): Promise<EmailAccount | undefined>;
  getAllAccounts(): Promise<EmailAccount[]>;
  createAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateAccountSyncTime(id: string): Promise<void>;
  deleteAccount(id: string): Promise<boolean>;
  
  // Emails
  getEmail(id: string): Promise<Email | undefined>;
  getEmailByMessageId(messageId: string, accountId: string): Promise<Email | undefined>;
  getAllEmails(): Promise<EmailWithAccount[]>;
  getEmailsByAccount(accountId: string): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailCategory(id: string, category: string): Promise<Email | undefined>;
  markEmailAsRead(id: string): Promise<Email | undefined>;
  deleteEmailsByAccount(accountId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private accounts: Map<string, EmailAccount>;
  private emails: Map<string, Email>;

  constructor() {
    this.accounts = new Map();
    this.emails = new Map();
  }

  // Email Accounts
  async getAccount(id: string): Promise<EmailAccount | undefined> {
    return this.accounts.get(id);
  }

  async getAccountByEmail(email: string): Promise<EmailAccount | undefined> {
    return Array.from(this.accounts.values()).find(
      (account) => account.email === email,
    );
  }

  async getAllAccounts(): Promise<EmailAccount[]> {
    return Array.from(this.accounts.values());
  }

  async createAccount(insertAccount: InsertEmailAccount): Promise<EmailAccount> {
    const id = randomUUID();
    const account: EmailAccount = {
      id,
      ...insertAccount,
      isActive: true,
      lastSyncedAt: null,
      createdAt: new Date(),
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccountSyncTime(id: string): Promise<void> {
    const account = this.accounts.get(id);
    if (account) {
      account.lastSyncedAt = new Date();
      this.accounts.set(id, account);
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    const deleted = this.accounts.delete(id);
    if (deleted) {
      // Also delete all emails associated with this account
      await this.deleteEmailsByAccount(id);
    }
    return deleted;
  }

  // Emails
  async getEmail(id: string): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async getEmailByMessageId(messageId: string, accountId: string): Promise<Email | undefined> {
    return Array.from(this.emails.values()).find(
      (email) => email.messageId === messageId && email.accountId === accountId,
    );
  }

  async getAllEmails(): Promise<EmailWithAccount[]> {
    const emails = Array.from(this.emails.values());
    return Promise.all(
      emails.map(async (email) => {
        const account = await this.getAccount(email.accountId);
        return {
          ...email,
          accountEmail: account?.email || "Unknown",
        };
      })
    );
  }

  async getEmailsByAccount(accountId: string): Promise<Email[]> {
    return Array.from(this.emails.values()).filter(
      (email) => email.accountId === accountId,
    );
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = randomUUID();
    const email: Email = {
      id,
      ...insertEmail,
      createdAt: new Date(),
    };
    this.emails.set(id, email);
    return email;
  }

  async updateEmailCategory(id: string, category: string): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (email) {
      email.category = category;
      this.emails.set(id, email);
      return email;
    }
    return undefined;
  }

  async markEmailAsRead(id: string): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (email) {
      email.isRead = true;
      this.emails.set(id, email);
      return email;
    }
    return undefined;
  }

  async deleteEmailsByAccount(accountId: string): Promise<void> {
    const emailsToDelete = Array.from(this.emails.entries())
      .filter(([_, email]) => email.accountId === accountId)
      .map(([id, _]) => id);
    
    emailsToDelete.forEach((id) => this.emails.delete(id));
  }
}

export const storage = new MemStorage();
