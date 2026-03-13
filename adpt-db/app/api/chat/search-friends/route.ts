import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/Users';
import { FriendRequest } from '@/lib/models/FriendRequest';

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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // 1. Find users matching the search query
    // Exclude the current user from results
    const users = await User.find({
      _id: { $ne: currentUser._id },
      $or: [
        { userName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('_id clerkId userName email userImage friends')
      .limit(10)
      .lean();

    // 2. Enhance results with relationship status
    const formattedUsers = await Promise.all(users.map(async (user) => {
      // Check if already friends
      const isFriend = currentUser.friends.includes(user._id);

      // Check if there is a pending request
      const pendingRequest = await FriendRequest.findOne({
        $or: [
          { sender: currentUser._id, receiver: user._id, status: 'pending' },
          { sender: user._id, receiver: currentUser._id, status: 'pending' }
        ]
      });

      return {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.userName,
        userName: user.userName,
        email: user.email,
        avatar: user.userImage,
        userImage: user.userImage,
        relationship: isFriend ? 'friend' : (pendingRequest ? 'pending' : 'none')
      };
    }));

    console.log(`✅ Found ${formattedUsers.length} users matching: ${query}`);
    return NextResponse.json(formattedUsers, { status: 200 });
  } catch (error) {
    console.error('Error searching friends:', error);
    return NextResponse.json(
      { error: 'Failed to search friends' },
      { status: 500 }
    );
  }
}