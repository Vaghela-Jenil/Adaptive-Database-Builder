import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUserId = currentUser._id;

    /**
     * AGGREGATION PIPELINE:
     * 1. Find all messages where user is sender or receiver.
     * 2. Sort by newest first.
     * 3. Group by the "other person" in the chat.
     * 4. Pick the first (latest) message for each group.
     */
    const conversationData = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } }
    ]);

    // Populate user details for each conversation partner
    const conversationList = await Promise.all(
      conversationData.map(async (item) => {
        const friend = await User.findById(item._id)
          .select('_id userName userImage chatStatus createdAt')
          .lean();

        if (!friend) return null;

        return {
          id: friend._id.toString(),
          friend: {
            id: friend._id.toString(),
            name: friend.userName,
            status: (friend.chatStatus || 'offline') as 'online' | 'offline',
            avatar: friend.userImage
          },
          lastMessage: item.lastMessage.content || '',
          lastMessageTime: item.lastMessage.createdAt,
          type: item.lastMessage.type,
          unreadCount: 0
        };
      })
    );

    // Filter out any nulls if a user was deleted but messages remain
    return NextResponse.json(conversationList.filter(Boolean));

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}