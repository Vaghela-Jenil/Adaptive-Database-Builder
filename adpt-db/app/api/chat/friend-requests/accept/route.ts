import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { FriendRequest } from '@/lib/models/FriendRequest';
import { User } from '@/lib/models/Users';

export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    // Populate sender to get their details immediately
    const friendRequest = await FriendRequest.findById(requestId).populate('sender');
    
    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Security check: Only the receiver can accept/reject the request
    if (friendRequest.receiver.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      // 1. Check if they are already friends (to prevent duplicates)
      if (currentUser.friends.includes(friendRequest.sender._id)) {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }

      // 2. Add each other to friends lists
      const sender = friendRequest.sender;
      
      currentUser.friends.push(sender._id);
      sender.friends.push(currentUser._id);

      // 3. Update request status
      friendRequest.status = 'accepted';

      // 4. Save all changes
      await Promise.all([
        currentUser.save(),
        sender.save(),
        friendRequest.save()
      ]);

      // 5. Return both users' info for socket emission on client
      const responseData = {
        message: 'Friend request accepted',
        success: true,
        friendRequest,
        sender: {
          id: sender._id.toString(),
          name: sender.userName,
          image: sender.userImage,
        },
        accepter: {
          id: currentUser._id.toString(),
          name: currentUser.userName,
          image: currentUser.userImage,
        }
      };

      console.log('✅ Friend request accepted successfully:', { senderId: sender._id, accepterId: currentUser._id });
      return NextResponse.json(responseData, { status: 200 });
    } 
    
    if (action === 'reject') {
      // Simply delete or mark as rejected
      // Option: friendRequest.status = 'rejected'; await friendRequest.save();
      // Cleaner: Just delete the request so they can try again later
      await FriendRequest.findByIdAndDelete(requestId);

      return NextResponse.json({
        message: 'Friend request rejected and removed',
        success: true
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}