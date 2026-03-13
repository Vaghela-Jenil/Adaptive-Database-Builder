import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/models/Users';
import { connectDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      console.error('❌ No clerkId in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ clerkId })
      .select('_id userName userImage email chatStatus')
      .lean();
      
    if (!user) {
      console.error(`❌ User not found for clerkId: ${clerkId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = {
      userId: user._id.toString(),
      userName: user.userName,
      userImage: user.userImage,
      email: user.email,
      chatStatus: user.chatStatus || 'offline'
    };

    console.log(`✅ Current user fetched: ${response.userId}`);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}