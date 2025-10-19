import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmailAccountSchema, 
  updateEmailCategorySchema,
  searchFiltersSchema 
} from "@shared/schema";
import { startIMAPSync, stopIMAPSync } from "./lib/imap-sync";
import { searchEmails, updateEmailInES } from "./lib/elasticsearch";
import { categorizeEmail } from "./lib/openai";
import { sendSlackNotification, sendWebhook } from "./lib/webhooks";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ========== Email Accounts ==========
  
  // Get all email accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // Create email account
  app.post("/api/accounts", async (req, res) => {
    try {
      const validatedData = insertEmailAccountSchema.parse(req.body);
      
      // Check if account already exists
      const existing = await storage.getAccountByEmail(validatedData.email);
      if (existing) {
        return res.status(400).json({ error: "Account already exists" });
      }

      const account = await storage.createAccount(validatedData);
      
      // Start IMAP sync for this account
      await startIMAPSync(account);

      res.status(201).json(account);
    } catch (error: any) {
      console.error("Error creating account:", error);
      res.status(400).json({ error: error.message || "Failed to create account" });
    }
  });

  // Delete email account
  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Stop IMAP sync
      stopIMAPSync(id);

      // Delete account from storage
      const deleted = await storage.deleteAccount(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // ========== Emails ==========

  // Get all emails with filters
  app.get("/api/emails", async (req, res) => {
    try {
      const filters = searchFiltersSchema.parse({
        query: req.query.query,
        accountId: req.query.accountId,
        folder: req.query.folder,
        category: req.query.category,
        hasAttachments: req.query.hasAttachments === "true" ? true : req.query.hasAttachments === "false" ? false : undefined,
        isRead: req.query.isRead === "true" ? true : req.query.isRead === "false" ? false : undefined,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      });

      // Try Elasticsearch first
      let emails = await searchEmails(filters);
      
      // If Elasticsearch returns nothing or fails, fallback to memory
      if (emails.length === 0) {
        const allEmails = await storage.getAllEmails();
        
        // Apply filters
        emails = allEmails.filter((email) => {
          if (filters.accountId && email.accountId !== filters.accountId) return false;
          if (filters.folder && email.folder !== filters.folder) return false;
          if (filters.category && email.category !== filters.category) return false;
          if (filters.hasAttachments !== undefined && email.hasAttachments !== filters.hasAttachments) return false;
          if (filters.isRead !== undefined && email.isRead !== filters.isRead) return false;
          if (filters.query) {
            const searchLower = filters.query.toLowerCase();
            const matchesSearch = 
              email.subject.toLowerCase().includes(searchLower) ||
              email.from.toLowerCase().includes(searchLower) ||
              email.bodyText?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }
          return true;
        });
        
        // Sort by received date descending
        emails.sort((a, b) => 
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
      }

      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  // Get single email
  app.get("/api/emails/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = await storage.getEmail(id);
      
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      const account = await storage.getAccount(email.accountId);
      const emailWithAccount = {
        ...email,
        accountEmail: account?.email || "Unknown",
      };

      res.json(emailWithAccount);
    } catch (error) {
      console.error("Error fetching email:", error);
      res.status(500).json({ error: "Failed to fetch email" });
    }
  });

  // Update email category
  app.patch("/api/emails/:id/category", async (req, res) => {
    try {
      const { id } = req.params;
      const { category } = updateEmailCategorySchema.parse(req.body);

      const email = await storage.updateEmailCategory(id, category);
      
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      // Update in Elasticsearch
      await updateEmailInES(id, { category });

      // Send notifications if newly categorized as "Interested"
      if (category === "Interested") {
        await Promise.all([
          sendSlackNotification(email),
          sendWebhook(email),
        ]);
      }

      res.json(email);
    } catch (error: any) {
      console.error("Error updating email category:", error);
      res.status(400).json({ error: error.message || "Failed to update category" });
    }
  });

  // Mark email as read
  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const email = await storage.markEmailAsRead(id);
      
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      // Update in Elasticsearch
      await updateEmailInES(id, { isRead: true });

      res.json(email);
    } catch (error) {
      console.error("Error marking email as read:", error);
      res.status(500).json({ error: "Failed to mark email as read" });
    }
  });

  // ========== Health Check ==========
  
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      elasticsearch: process.env.ELASTICSEARCH_URL || "Not configured",
      openai: process.env.OPENAI_API_KEY ? "Configured" : "Not configured",
      slack: process.env.SLACK_WEBHOOK_URL ? "Configured" : "Not configured",
      webhook: process.env.WEBHOOK_SITE_URL ? "Configured" : "Not configured",
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
