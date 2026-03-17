import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

export async function PATCH(request: NextRequest) {
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

    const { senderId } = await request.json();

    if (!senderId) {
      return NextResponse.json(
        { error: 'senderId is required' },
        { status: 400 }
      );
    }

    // Validate senderId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return NextResponse.json(
        { error: 'Invalid senderId' },
        { status: 400 }
      );
    }

    // Mark all unread messages from this sender as read
    const result = await Message.updateMany(
      {
        sender: new mongoose.Types.ObjectId(senderId),
        receiver: currentUser._id,
        read: false
      },
      { $set: { read: true } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
