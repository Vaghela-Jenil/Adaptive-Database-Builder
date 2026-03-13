import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { FriendRequest } from '@/lib/models/FriendRequest';
import { User } from '@/lib/models/Users';

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

    // Validation 1: Check receiverId exists and is not self
    if (!receiverId) {
      console.error('❌ No receiverId provided');
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
    }

    if (receiverId === currentUser._id.toString()) {
      console.error(`❌ Cannot send request to self: ${receiverId}`);
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
    }

    // Validation 2: Check receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.error(`❌ Receiver user not found: ${receiverId}`);
      return NextResponse.json({ error: 'Recipient not found' }, { status: 400 });
    }

    // Validation 3: Check for existing request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: currentUser._id, receiver: receiverId },
        { sender: receiverId, receiver: currentUser._id }
      ]
    });

    if (existingRequest) {
      console.error(`❌ Request already exists between ${currentUser._id} and ${receiverId}`);
      return NextResponse.json({ 
        error: existingRequest.status === 'pending' 
          ? 'Request already sent' 
          : 'Request already processed' 
      }, { status: 400 });
    }

    // Validation 4: Check if already friends
    if (receiver.friends && receiver.friends.includes(currentUser._id)) {
      console.error(`❌ Already friends: ${currentUser._id} and ${receiverId}`);
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // All validations passed, create the request
    const friendRequest = await FriendRequest.create({
      sender: currentUser._id,
      receiver: receiverId,
      status: 'pending'
    });

    console.log(`✅ Friend request sent from ${currentUser._id} to ${receiverId}`);
    
    return NextResponse.json({ 
      message: 'Friend request sent', 
      friendRequest,
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error sending friend request:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send request', 
      success: false 
    }, { status: 500 });
  }
}