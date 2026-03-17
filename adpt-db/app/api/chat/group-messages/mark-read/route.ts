import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { GroupMessage } from '@/lib/models/GroupMessage';
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

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId is required' },
        { status: 400 }
      );
    }

    // Validate groupId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { error: 'Invalid groupId' },
        { status: 400 }
      );
    }

    // Mark all unread messages in this group as read by this user
    const result = await GroupMessage.updateMany(
      {
        groupId: new mongoose.Types.ObjectId(groupId),
        readBy: { $nin: [currentUser._id] }
      },
      { $push: { readBy: currentUser._id } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking group messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark group messages as read' },
      { status: 500 }
    );
  }
}
