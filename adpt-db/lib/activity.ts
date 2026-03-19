import { ActivityLogModel } from "@/lib/models/ActivityLog";
import { connectDB } from "@/lib/mongodb";

export interface ActivityLogData {
  clerkId: string;
  type:
    | "create"
    | "update"
    | "delete"
    | "password"
    | "share"
    | "query"
    | "login"
    | "logout"
    | "schema"
    | "open"
    | "remove_connection"
    | "request_accepted"
    | "access_granted"
    | "access_updated"
    | "friend_removed";
  title: string;
  description: string;
  metadata?: {
    databaseId?: string;
    databaseName?: string;
    userId?: string;
    userName?: string;
    recordId?: string;
    recordCount?: number;
    role?: string;
  };
}

/**
 * Server-side activity logging - use this in API routes
 * This directly saves to the database without making HTTP requests
 */
export async function logActivityServer(data: ActivityLogData) {
  try {
    await connectDB();

    const activity = new ActivityLogModel({
      clerkId: data.clerkId,
      type: data.type,
      title: data.title,
      description: data.description,
      timestamp: new Date(),
      metadata: data.metadata || {},
    });

    const savedActivity = await activity.save();
    console.debug("Activity logged:", data.type, data.title);
    return { success: true, activity: savedActivity };
  } catch (error) {
    console.error("Error logging activity:", error);
    return { success: false, error };
  }
}

/**
 * Get user activities - use this in API routes
 */
export async function getActivitiesServer(clerkId: string, limit: number = 100) {
  try {
    await connectDB();

    const activities = await ActivityLogModel.find({ clerkId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return activities;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}
