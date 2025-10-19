import axios from "axios";
import type { Email } from "@shared/schema";

// Send Slack notification
export async function sendSlackNotification(email: Email) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!slackWebhookUrl) {
    console.log("Slack webhook URL not configured");
    return;
  }

  try {
    const message = {
      text: `🎯 New Interested Email!`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 New Interested Email",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:*\n${email.from}`,
            },
            {
              type: "mrkdwn",
              text: `*Subject:*\n${email.subject}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Preview:*\n${email.bodyText?.substring(0, 200) || "No preview available"}...`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Received: ${new Date(email.receivedAt).toLocaleString()}`,
            },
          ],
        },
      ],
    };

    await axios.post(slackWebhookUrl, message);
    console.log(`Slack notification sent for email: ${email.subject}`);
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
}

// Send external webhook
export async function sendWebhook(email: Email) {
  const webhookUrl = process.env.WEBHOOK_SITE_URL;
  
  if (!webhookUrl) {
    console.log("External webhook URL not configured");
    return;
  }

  try {
    const payload = {
      event: "email_interested",
      timestamp: new Date().toISOString(),
      email: {
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        category: email.category,
        receivedAt: email.receivedAt,
        preview: email.bodyText?.substring(0, 200),
      },
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(`External webhook triggered for email: ${email.subject}`);
  } catch (error) {
    console.error("Error sending external webhook:", error);
  }
}
