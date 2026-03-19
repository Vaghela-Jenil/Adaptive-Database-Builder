import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/Users';
import { FriendRequest } from '@/lib/models/FriendRequest';
import { Message } from '@/lib/models/Message';
import { logFriendRemoved } from '@/lib/activityLogger';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId }).populate('friends');
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform friends data to match frontend expectations
    const friends = (currentUser.friends || []).map((friend: any) => ({
      id: friend._id.toString(),
      friend: {
        id: friend._id.toString(),
        name: friend.userName || 'Unknown User',
        avatar: friend.userImage || null,
        status: friend.chatStatus || 'offline',
      },
      lastMessage: 'No messages yet',
      lastMessageTime: null,
    }));

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    // Validate friendId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return NextResponse.json({ error: 'Invalid friend ID format' }, { status: 400 });
    }

    const friendObjectId = new mongoose.Types.ObjectId(friendId);
    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get friend details for logging
    const friendToRemove = await User.findById(friendObjectId);
    if (!friendToRemove) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    // Check if they are actually friends (convert to strings for proper comparison)
    const isFriend = currentUser.friends.some((id: any) => id.toString() === friendObjectId.toString());
    if (!isFriend) {
      return NextResponse.json({ error: 'Not friends with this user' }, { status: 400 });
    }

    console.log(`🔄 Deleting friendship between ${currentUser._id} and ${friendObjectId}`);
    console.log(`   Current user friends before: ${currentUser.friends.length}`);
    console.log(`   Friend's friends before: ${friendToRemove.friends.length}`);

    // Remove from current user's friends list - use updateOne for safety
    currentUser.friends = currentUser.friends.filter((id: any) => id.toString() !== friendObjectId.toString());
    await currentUser.save();
    console.log(`✅ Removed ${friendObjectId} from ${currentUser._id}'s friends list`);
    console.log(`   Current user friends after: ${currentUser.friends.length}`);

    // Remove from friend's friends list - use updateOne for safety
    friendToRemove.friends = friendToRemove.friends.filter((id: any) => id.toString() !== currentUser._id.toString());
    await friendToRemove.save();
    console.log(`✅ Removed ${currentUser._id} from ${friendObjectId}'s friends list`);
    console.log(`   Friend's friends after: ${friendToRemove.friends.length}`);

    // Verify both sides were removed
    const verifyCurrentUser = await User.findById(currentUser._id);
    const verifyFriend = await User.findById(friendObjectId);
    
    const stillInCurrentUser = verifyCurrentUser?.friends?.some((id: any) => id.toString() === friendObjectId.toString());
    const stillInFriend = verifyFriend?.friends?.some((id: any) => id.toString() === currentUser._id.toString());
    
    if (stillInCurrentUser || stillInFriend) {
      console.error(`❌ Friendship not fully removed! Still in current user: ${stillInCurrentUser}, Still in friend: ${stillInFriend}`);
      return NextResponse.json({ 
        error: 'Failed to fully delete friendship',
        details: {
          stillInCurrentUser,
          stillInFriend
        }
      }, { status: 500 });
    }
    console.log(`✅ Verified: Friendship fully removed on both sides`);

    // Delete ALL messages in the conversation (cleanup)
    const messageResult = await Message.deleteMany({
      $or: [
        { sender: currentUser._id, receiver: friendObjectId },
        { receiver: currentUser._id, sender: friendObjectId }
      ]
    });
    console.log(`🗑️  Deleted ${messageResult.deletedCount} messages in the conversation`);

    // Clean up any pending or accepted friend requests between these users
    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUser._id, receiver: friendObjectId },
        { sender: friendObjectId, receiver: currentUser._id }
      ]
    });
    console.log(`🧹 Cleaned up friend requests`);

    // Log the friend removal activity
    await logFriendRemoved(friendToRemove.userName || 'Unknown User', clerkId);

    return NextResponse.json({
      message: 'Friend removed successfully',
      success: true,
      deletedMessages: messageResult.deletedCount
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
