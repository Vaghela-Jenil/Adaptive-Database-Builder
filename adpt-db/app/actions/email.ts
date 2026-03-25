"use server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import { EmailLogs } from "@/lib/models/emails";

export async function sendAdminEmail(data: {
  toEmail: string;
  userName: string;
  subject: string;
  message: string;
  attachments?: { content: string; filename: string }[];
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
    rejectUnauthorized: false 
  }
});

    const safeName = data.userName || "Customer";
    const finalHtml = data.message.replace(/{{userName}}/gi, safeName);

    // 2. Format attachments for Nodemailer
    const formattedAttachments = data.attachments?.map((file) => ({
      filename: file.filename,
      content: file.content,
      encoding: 'base64' // Tells Nodemailer the string is Base64
    })) || [];

    // 3. Send the Mail
    const info = await transporter.sendMail({
      from: `"Admin" <${process.env.GMAIL_USER}>`,
      to: data.toEmail,
      subject: data.subject,
      html: `<div style="font-family: sans-serif; padding: 20px;">${finalHtml}</div>`,
      attachments: formattedAttachments,
    });

    // 4. Log to MongoDB
    const newLog = await EmailLogs.create({
      subject: data.subject,
      body: finalHtml,
      recipientEmail: data.toEmail,
      recipientName: safeName,
      status: "sent",
      messageId: info.messageId,
      attachmentsCount: formattedAttachments.length,
    });

    return { success: true, log: JSON.parse(JSON.stringify(newLog)) };
  } catch (error: any) {
    console.error("Nodemailer Error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(data: {
  toEmail: string;
  userName: string;
}) {
  try {
    await connectDB();
    
    // Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER?.trim(),
        pass: process.env.GMAIL_PASS?.trim(),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const safeName = data.userName || "User";
    const subject = "Welcome to Suventra! 🎉";
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">Welcome to Suventra!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Journey Starts Now</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; color: #333;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            Hi <strong>${safeName}</strong>,
          </p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for joining Suventra! We're thrilled to have you onboard. 🚀
          </p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Suventra is designed to help you easily manage, analyze, and collaborate on your databases. Here's what you can do:
          </p>
          
          <ul style="font-size: 14px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px; color: #555;">
            <li>📊 Create and manage multiple databases</li>
            <li>📈 Gain insights with powerful analytics</li>
            <li>👥 Share databases with your team members</li>
            <li>📝 Build custom forms for data entry</li>
            <li>🤖 Chat with AI for database assistance</li>
            <li>💾 Export and import your data</li>
          </ul>

          <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="font-size: 14px; margin: 0; color: #667eea;">
              <strong>💡 Tip:</strong> Check out the onboarding tour when you first log in to explore all the features!
            </p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!
          </p>

          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000/user/dashboard'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">
              Get Started
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
            You're receiving this email because you recently created an account with Suventra. If you didn't sign up, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Suventra" <${process.env.GMAIL_USER}>`,
      to: data.toEmail,
      subject: subject,
      html: htmlContent,
    });

    // Log to MongoDB
    const newLog = await EmailLogs.create({
      subject: subject,
      body: htmlContent,
      recipientEmail: data.toEmail,
      recipientName: safeName,
      status: "sent",
      messageId: info.messageId,
      attachmentsCount: 0,
    });

    return { success: true, log: JSON.parse(JSON.stringify(newLog)) };
  } catch (error: any) {
    console.error("Welcome Email Error:", error);
    return { success: false, error: error.message };
  }
}