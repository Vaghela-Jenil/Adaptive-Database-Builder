import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/Users';

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
