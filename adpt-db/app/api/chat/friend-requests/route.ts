import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { FriendRequest } from '@/lib/models/FriendRequest';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

// GET: Fetch pending friend requests for the current user
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const pendingRequests = await FriendRequest.find({
      receiver: currentUser._id,
      status: 'pending'
    })
      .populate('sender', '_id userName userImage email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${pendingRequests.length} pending requests for user ${currentUser._id}`);
    return NextResponse.json(pendingRequests, { status: 200 });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a new friend request
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.error('❌ No clerkId in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) {
      console.error(`❌ Current user not found for clerkId: ${clerkId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { receiverId } = await request.json();
    console.log(`📤 Attempting to send friend request from ${currentUser._id} to ${receiverId}`);

    // Validation 1: Check receiverId exists
    if (!receiverId) {
      console.error('❌ No receiverId provided');
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
    }

    // Validation 2: Ensure receiverId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      console.error(`❌ Invalid receiverId format: ${receiverId}`);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Validation 3: Check if trying to send to self
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
    if (receiverObjectId.toString() === currentUser._id.toString()) {
      console.error(`❌ Cannot send request to self: ${receiverId}`);
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
    }

    // Validation 4: Check receiver exists
    const receiver = await User.findById(receiverObjectId);
    if (!receiver) {
      console.error(`❌ Receiver user not found: ${receiverId}`);
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Validation 5: Check if already friends (check both directions)
    const currentUserIdString = currentUser._id.toString();
    const receiverIdString = receiverObjectId.toString();
    
    // Check if receiver has current user in their friends list
    const isFriendFromReceiversPerspective = receiver.friends && receiver.friends.some(
      (id: any) => id.toString() === currentUserIdString
    );
    
    // Check if current user has receiver in their friends list
    const isFriendFromCurrentUsersPerspective = currentUser.friends && currentUser.friends.some(
      (id: any) => id.toString() === receiverIdString
    );
    
    if (isFriendFromReceiversPerspective || isFriendFromCurrentUsersPerspective) {
      console.error(`❌ Already friends: ${currentUser._id} and ${receiverObjectId}`);
      
      // If friendship is one-sided (data corruption), fix it automatically
      if (isFriendFromReceiversPerspective && !isFriendFromCurrentUsersPerspective) {
        console.warn(`⚠️  One-sided friendship detected: receiver has current user, but not vice versa. FIXING...`);
        receiver.friends = receiver.friends.filter((id: any) => id.toString() !== currentUserIdString);
        await receiver.save();
        console.log(`✅ Fixed: Removed one-sided friendship`);
        // Now allow the friend request to be sent
      } else if (!isFriendFromReceiversPerspective && isFriendFromCurrentUsersPerspective) {
        console.warn(`⚠️  One-sided friendship detected: current user has receiver, but not vice versa. FIXING...`);
        currentUser.friends = currentUser.friends.filter((id: any) => id.toString() !== receiverIdString);
        await currentUser.save();
        console.log(`✅ Fixed: Removed one-sided friendship`);
        // Now allow the friend request to be sent
      } else {
        // Both have each other as friends - they are legitimately friends
        return NextResponse.json({ error: 'You are already friends with this user' }, { status: 400 });
      }
    }

    // Validation 6: Check for existing request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: currentUser._id, receiver: receiverObjectId },
        { sender: receiverObjectId, receiver: currentUser._id }
      ]
    });

    if (existingRequest) {
      // If there's an accepted request but they're not friends, it's a stale record - delete it
      if (existingRequest.status === 'accepted') {
        console.log(`🧹 Cleaning up stale accepted request between ${currentUser._id} and ${receiverObjectId}`);
        await FriendRequest.deleteOne({ _id: existingRequest._id });
        // Continue to create new request
      } else if (existingRequest.status === 'pending') {
        console.error(`❌ Pending request already exists between ${currentUser._id} and ${receiverObjectId}`);
        return NextResponse.json({ 
          error: 'Friend request already sent' 
        }, { status: 400 });
      } else {
        console.error(`❌ Request already exists between ${currentUser._id} and ${receiverObjectId}`);
        return NextResponse.json({ 
          error: 'This relationship has already been processed' 
        }, { status: 400 });
      }
    }

    // All validations passed, create the request
    const friendRequest = await FriendRequest.create({
      sender: currentUser._id,
      receiver: receiverObjectId,
      status: 'pending'
    });

    console.log(`✅ Friend request sent from ${currentUser._id} to ${receiverObjectId}`);
    
    return NextResponse.json({ 
      message: 'Friend request sent', 
      friendRequest,
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error sending friend request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send request';
    return NextResponse.json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}