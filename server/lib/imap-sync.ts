import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { getStorage } from "../storage";
import type { EmailAccount, InsertEmail } from "@shared/schema";
import { categorizeEmail } from "./openai";
import { indexEmail } from "./elasticsearch";
import { sendSlackNotification, sendWebhook } from "./webhooks";

// Active IMAP connections
const activeConnections = new Map<string, Imap>();

// Start IMAP sync for an account
export async function startIMAPSync(account: EmailAccount) {
  try {
    // Close existing connection if any
    if (activeConnections.has(account.id)) {
      const existingImap = activeConnections.get(account.id);
      existingImap?.end();
      activeConnections.delete(account.id);
    }

    const imap = new Imap({
      user: account.imapUser,
      password: account.imapPassword,
      host: account.imapHost,
      port: account.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => {
      console.log(`IMAP connected for ${account.email}`);
      
      // Open inbox
      imap.openBox("INBOX", false, (err) => {
        if (err) {
          console.error(`Error opening inbox for ${account.email}:`, err);
          return;
        }

        // Fetch last 30 days of emails on initial sync
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        fetchEmails(imap, account, ["ALL"]);

        // Start IDLE mode for real-time updates
        startIDLE(imap, account);
      });
    });

    imap.once("error", (err: Error) => {
      console.error(`IMAP error for ${account.email}:`, err);
    });

    imap.once("end", () => {
      console.log(`IMAP connection ended for ${account.email}`);
      activeConnections.delete(account.id);
    });

    imap.connect();
    activeConnections.set(account.id, imap);

  } catch (error) {
    console.error(`Error starting IMAP sync for ${account.email}:`, error);
  }
}

// Start IDLE mode for real-time updates
function startIDLE(imap: Imap, account: EmailAccount) {
  imap.on("mail", () => {
    console.log(`New mail received for ${account.email}`);
    // Fetch new emails
    fetchEmails(imap, account, ["UNSEEN"]);
  });

  // Refresh IDLE every 10 minutes to keep connection alive
  const idleInterval = setInterval(() => {
    if (imap.state === "authenticated") {
      imap.idle();
    } else {
      clearInterval(idleInterval);
    }
  }, 10 * 60 * 1000);
}

// Fetch emails from IMAP
async function fetchEmails(imap: Imap, account: EmailAccount, searchCriteria: any[]) {
  try {
    imap.search(searchCriteria, (err, results) => {
      if (err) {
        console.error(`Error searching emails for ${account.email}:`, err);
        return;
      }

      if (!results || results.length === 0) {
        console.log(`No new emails for ${account.email}`);
        return;
      }

      // Limit to last 100 emails to avoid overwhelming the system
      const uids = results.slice(-100);
      
      const fetch = imap.fetch(uids, {
        bodies: "",
        struct: true,
      });

      fetch.on("message", (msg) => {
        let buffer = "";
        let uid: number;

        msg.on("body", (stream) => {
          stream.on("data", (chunk) => {
            buffer += chunk.toString("utf8");
          });
        });

        msg.once("attributes", (attrs) => {
          uid = attrs.uid;
        });

        msg.once("end", async () => {
          try {
            const parsed = await simpleParser(buffer);
            
            // Check if email already exists
            const messageId = parsed.messageId || `${account.id}-${uid}`;
            const existing = await getStorage().getEmailByMessageId(messageId, account.id);
            
            if (existing) {
              console.log(`Email already exists: ${messageId}`);
              return;
            }

            const bodyText = parsed.text || "";
            const bodyHtml = parsed.html || "";
            
            // Categorize email using AI
            const categorization = await categorizeEmail(
              parsed.subject || "",
              bodyText,
              parsed.from?.text || ""
            );

            // Create email object
            const emailData: InsertEmail = {
              accountId: account.id,
              messageId,
              from: parsed.from?.text || "",
              to: parsed.to?.text || "",
              subject: parsed.subject || "(No Subject)",
              bodyText,
              bodyHtml: bodyHtml ? bodyHtml.toString() : null,
              folder: "INBOX",
              category: categorization.category,
              isRead: false,
              hasAttachments: (parsed.attachments?.length || 0) > 0,
              receivedAt: parsed.date || new Date(),
            };

            // Save to storage
            const email = await getStorage().createEmail(emailData);
            
            // Index in Elasticsearch
            await indexEmail(email);

            console.log(`Email saved and indexed: ${email.subject} (Category: ${email.category})`);

            // Send notifications if categorized as "Interested"
            if (categorization.category === "Interested") {
              await Promise.all([
                sendSlackNotification(email),
                sendWebhook(email),
              ]);
            }

            // Update account sync time
            await getStorage().updateAccountSyncTime(account.id);

          } catch (error) {
            console.error(`Error processing email for ${account.email}:`, error);
          }
        });
      });

      fetch.once("error", (err: Error) => {
        console.error(`Fetch error for ${account.email}:`, err);
      });

      fetch.once("end", () => {
        console.log(`Finished fetching emails for ${account.email}`);
      });
    });
  } catch (error) {
    console.error(`Error in fetchEmails for ${account.email}:`, error);
  }
}

// Stop IMAP sync for an account
export function stopIMAPSync(accountId: string) {
  const imap = activeConnections.get(accountId);
  if (imap) {
    imap.end();
    activeConnections.delete(accountId);
    console.log(`IMAP sync stopped for account ${accountId}`);
  }
}

// Start all active accounts
export async function startAllAccounts() {
  const accounts = await getStorage().getAllAccounts();
  for (const account of accounts) {
    if (account.isActive) {
      await startIMAPSync(account);
    }
  }
}
