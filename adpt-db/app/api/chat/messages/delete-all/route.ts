import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

export async function DELETE(request: NextRequest) {
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
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    // Validate friendId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return NextResponse.json({ error: 'Invalid friend ID format' }, { status: 400 });
    }

    const friendObjectId = new mongoose.Types.ObjectId(friendId);

    // Delete only the current user's messages sent to the friend
    const result = await Message.deleteMany({
      sender: currentUser._id,
      receiver: friendObjectId
    });

    console.log(`🗑️  Deleted ${result.deletedCount} messages between ${currentUser._id} and ${friendObjectId}`);

    return NextResponse.json({
      message: 'All messages deleted successfully',
      deletedCount: result.deletedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting all messages:', error);
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    );
  }
}
