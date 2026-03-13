import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const id = (await params).id;

    // Ensure the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Get current user
    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the message
    const message = await Message.findById(new mongoose.Types.ObjectId(id));
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user is the sender
    if (message.sender.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
    }

    // Delete the message
    await Message.findByIdAndDelete(new mongoose.Types.ObjectId(id));
    console.log(`🗑️ Direct message deleted: ${id}`);

    return NextResponse.json({ message: 'Message deleted successfully', deletedId: id }, { status: 200 });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}