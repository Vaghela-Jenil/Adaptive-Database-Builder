/**
 * Client-side utility for logging user activities
 * Use this in client components to track user actions
 */

import axios from "axios";

export type ActivityType =
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

export interface ActivityPayload {
  type: ActivityType;
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
 * Log an activity to the backend
 * @param activity - The activity payload
 */
export async function logActivity(activity: ActivityPayload): Promise<void> {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await axios.post(`${baseUrl}/api/activity`, activity);
    console.debug("Activity logged successfully:", activity.type);
  } catch (error: any) {
    const status = error.response?.status;
    const errorData = error.response?.data || {};
    console.error("Failed to log activity:", status, errorData);
    // Silently fail - don't interrupt user experience
  }
}

/**
 * Common activity logging functions
 */

export function logDatabaseCreate(databaseName: string, databaseId?: string) {
  return logActivity({
    type: "create",
    title: "Created Database",
    description: `Created new database '${databaseName}'`,
    metadata: {
      databaseId,
      databaseName,
    },
  });
}

export function logDatabaseDelete(databaseName: string, databaseId?: string) {
  return logActivity({
    type: "delete",
    title: "Deleted Database",
    description: `Deleted database '${databaseName}'`,
    metadata: {
      databaseId,
      databaseName,
    },
  });
}

export function logSchemaEdit(databaseName: string, databaseId?: string) {
  return logActivity({
    type: "schema",
    title: "Edited Form Schema",
    description: `Modified schema for '${databaseName}' database`,
    metadata: {
      databaseId,
      databaseName,
    },
  });
}

export function logPasswordSet(databaseName: string, databaseId?: string) {
  return logActivity({
    type: "password",
    title: "Set Password",
    description: `Set password protection for '${databaseName}' database`,
    metadata: {
      databaseId,
      databaseName,
    },
  });
}

export function logDatabaseShared(
  databaseName: string,
  userName: string,
  role: string,
  databaseId?: string
) {
  return logActivity({
    type: "share",
    title: "Shared Database",
    description: `Shared '${databaseName}' database with ${userName} as ${role}`,
    metadata: {
      databaseId,
      databaseName,
      userName,
      role,
    },
  });
}

export function logRecordsUpdated(
  databaseName: string,
  recordCount: number,
  databaseId?: string
) {
  return logActivity({
    type: "update",
    title: "Updated Records",
    description: `Updated ${recordCount} record${recordCount === 1 ? "" : "s"} in '${databaseName}' database`,
    metadata: {
      databaseId,
      databaseName,
      recordCount,
    },
  });
}

export function logRecordsDeleted(
  databaseName: string,
  recordCount: number,
  databaseId?: string
) {
  return logActivity({
    type: "delete",
    title: "Deleted Records",
    description: `Deleted ${recordCount} record${recordCount === 1 ? "" : "s"} from '${databaseName}' database`,
    metadata: {
      databaseId,
      databaseName,
      recordCount,
    },
  });
}

export function logQueryAsked(query: string) {
  return logActivity({
    type: "query",
    title: "Asked Query",
    description: `Queried '${query}' using AI Assistant`,
  });
}

export function logDatabaseOpened(databaseName: string, databaseId?: string) {
  return logActivity({
    type: "open",
    title: "Opened Database",
    description: `Accessed '${databaseName}' database`,
    metadata: {
      databaseId,
      databaseName,
    },
  });
}

export function logSharedConnectionRemoved(
  databaseName: string,
  userName: string,
  databaseId?: string
) {
  return logActivity({
    type: "remove_connection",
    title: "Removed Connection",
    description: `Removed shared access for '${databaseName}' from ${userName}`,
    metadata: {
      databaseId,
      databaseName,
      userName,
    },
  });
}

export function logLogin() {
  return logActivity({
    type: "login",
    title: "Logged In",
    description: "Successfully logged in to account",
  });
}

export function logLogout() {
  return logActivity({
    type: "logout",
    title: "Logged Out",
    description: "Successfully logged out from account",
  });
}

export function logFriendRequestAccepted(friendName: string, userId?: string) {
  return logActivity({
    type: "request_accepted",
    title: "Friend Request Accepted",
    description: `Accepted friend request from ${friendName}`,
    metadata: {
      userId,
      userName: friendName,
    },
  });
}

export function logDatabaseAccessGranted(
  databaseName: string,
  friendName: string,
  role: string,
  databaseId?: string
) {
  return logActivity({
    type: "access_granted",
    title: "Granted Database Access",
    description: `Granted access to '${databaseName}' database to ${friendName} as ${role}`,
    metadata: {
      databaseId,
      databaseName,
      userName: friendName,
      role,
    },
  });
}

export function logDatabaseAccessUpdated(
  databaseName: string,
  friendName: string,
  newRole: string,
  databaseId?: string
) {
  return logActivity({
    type: "access_updated",
    title: "Updated Database Access",
    description: `Updated access for '${databaseName}' database - ${friendName} now has ${newRole} role`,
    metadata: {
      databaseId,
      databaseName,
      userName: friendName,
      role: newRole,
    },
  });
}

export function logFriendRemoved(friendName: string, userId?: string) {
  return logActivity({
    type: "friend_removed",
    title: "Removed Friend",
    description: `Removed friend connection with ${friendName}`,
    metadata: {
      userId,
      userName: friendName,
    },
  });
}
