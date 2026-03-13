import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { GroupMessage } from '@/lib/models/GroupMessage';
import { User } from '@/lib/models/Users';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const messageId = (await params).id;
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('deleteAll') === 'true';

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (deleteAll) {
      // Delete all messages from current user in a group (need groupId in query)
      const groupId = searchParams.get('groupId');
      if (!groupId) {
        return NextResponse.json({ error: 'Group ID required for deleteAll' }, { status: 400 });
      }

      await GroupMessage.deleteMany({
        groupId,
        sender: currentUser._id,
      });

      return NextResponse.json({ message: 'All messages deleted' }, { status: 200 });
    } else {
      // Delete single message
      const message = await GroupMessage.findById(messageId);
      if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

      if (message.sender.toString() !== currentUser._id.toString()) {
        return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
      }

      await GroupMessage.findByIdAndDelete(messageId);
      return NextResponse.json({ message: 'Message deleted' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
