"use server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import { EmailLogs } from "@/lib/models/emails";

export async function sendQueryResolutionEmail(data: {
  toEmail: string;
  userName: string;
  querySubject: string;
  queryMessage: string;
  adminReply: string;
}) {
  try {
    await connectDB();

    // 1. Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.GMAIL_USER?.trim(),
        pass: process.env.GMAIL_PASS?.trim(),
      },
      // Add this to handle potential local certificate issues
      tls: {
        rejectUnauthorized: false,
      },
    });

    const safeName = data.userName || "Customer";

    // 2. Create Professional Email Template
    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .header p {
                margin: 5px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 30px 20px;
            }
            .greeting {
                font-size: 16px;
                margin-bottom: 20px;
                color: #333;
            }
            .query-section {
                background-color: #f9f9f9;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .section-title {
                font-weight: 600;
                color: #667eea;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }
            .section-content {
                color: #555;
                font-size: 14px;
                line-height: 1.6;
            }
            .query-label {
                font-weight: 600;
                color: #333;
                margin-top: 10px;
                margin-bottom: 5px;
            }
            .reply-section {
                background-color: #f0f4ff;
                border-left: 4px solid #10b981;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .reply-title {
                font-weight: 600;
                color: #10b981;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }
            .reply-content {
                color: #333;
                font-size: 14px;
                line-height: 1.8;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 20px;
                text-align: center;
                color: #888;
                font-size: 12px;
                border-top: 1px solid #eee;
            }
            .status-badge {
                display: inline-block;
                background-color: #10b981;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-top: 15px;
            }
            .divider {
                border: 0;
                border-top: 1px solid #eee;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✓ Your Query Has Been Resolved</h1>
                <p>A response to your support request</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Hello <strong>${safeName}</strong>,</p>
                    <p>Thank you for contacting our support team. We're pleased to inform you that your query has been reviewed and resolved. Please review the details and our response below.</p>
                </div>
                
                <div class="query-section">
                    <div class="section-title">📋 Your Query</div>
                    <div class="section-content">
                        <div class="query-label">Subject:</div>
                        <p style="margin: 0 0 10px 0;">${data.querySubject}</p>
                        <div class="query-label">Message:</div>
                        <p style="margin: 0;">${data.queryMessage.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
                
                <hr class="divider">
                
                <div class="reply-section">
                    <div class="reply-title">✓ Our Response</div>
                    <div class="reply-content">${data.adminReply.replace(/\n/g, '<br>')}</div>
                </div>
                
                <div style="text-align: center;">
                    <span class="status-badge">RESOLVED</span>
                </div>
                
                <p style="margin-top: 25px; color: #666; font-size: 13px; line-height: 1.6;">
                    If you need any further assistance or have additional questions, please don't hesitate to reach out to us. We're here to help!
                </p>
            </div>
            
            <div class="footer">
                <p style="margin: 0 0 5px 0;">© 2026 Your Application. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // 3. Send the Mail
    const info = await transporter.sendMail({
      from: `"Support Team" <${process.env.GMAIL_USER}>`,
      to: data.toEmail,
      subject: `Re: ${data.querySubject} - Query Resolved ✓`,
      html: emailTemplate,
    });

    // 4. Log to MongoDB
    const newLog = await EmailLogs.create({
      subject: `Re: ${data.querySubject} - Query Resolved`,
      body: emailTemplate,
      recipientEmail: data.toEmail,
      recipientName: safeName,
      status: "sent",
      messageId: info.messageId,
      emailType: "query_resolution",
    });

    return { success: true, log: JSON.parse(JSON.stringify(newLog)) };
  } catch (error: any) {
    console.error("Query Email Error:", error);
    
    // Log failed attempt
    try {
      await connectDB();
      await EmailLogs.create({
        subject: `Re: ${data.querySubject} - Query Resolved (FAILED)`,
        body: `Failed to send email. Error: ${error.message}`,
        recipientEmail: data.toEmail,
        recipientName: data.userName,
        status: "failed",
        emailType: "query_resolution",
        errorMessage: error.message,
      });
    } catch (logErr) {
      console.error("Failed to log email error:", logErr);
    }

    return { success: false, error: error.message };
  }
}
