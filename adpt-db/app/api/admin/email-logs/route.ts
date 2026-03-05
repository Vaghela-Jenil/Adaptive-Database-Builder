import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { EmailLogs } from "@/lib/models/emails";

// GET /api/email-logs (For Sidebar)
export async function GET() {
  await connectDB();
  const logs = await EmailLogs.find().sort({ sentAt: -1 }).limit(10);
  return Response.json({ success: true, data: logs });
}
