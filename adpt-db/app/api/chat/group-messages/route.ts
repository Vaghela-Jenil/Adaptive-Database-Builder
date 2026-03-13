import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { GroupMessage } from '@/lib/models/GroupMessage';
import { User } from '@/lib/models/Users';
import { encryptMessage, generateSharedKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const messages = await GroupMessage.find({ groupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(messages.reverse(), { status: 200 });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const body = await request.json();
    const { groupId, content, type, fileUrl, fileName, fileSize } = body;

    if (!groupId || !content) {
      return NextResponse.json({ error: 'Missing groupId or content' }, { status: 400 });
    }

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Encrypt message content
    const encryptionKey = `group_${groupId}`;
    const encryptedContent = encryptMessage(content, encryptionKey);

    const message = await GroupMessage.create({
      groupId,
      sender: currentUser._id,
      senderName: currentUser.userName,
      senderImage: currentUser.userImage,
      content: encryptedContent,
      type: type || 'text',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
    });

    return NextResponse.json(
      {
        _id: message._id.toString(),
        sender: currentUser._id.toString(),
        senderName: currentUser.userName,
        senderImage: currentUser.userImage,
        content, // Return decrypted for sender
        type: message.type,
        timestamp: message.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending group message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
