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