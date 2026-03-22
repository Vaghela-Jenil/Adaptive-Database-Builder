import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/Users';
import { encryptMessage, decryptMessage, generateSharedKey, isEncrypted } from '@/lib/encryption';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch messages between these two users
    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, receiver: friendId },
        { sender: friendId, receiver: currentUser._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse to show in chronological order (oldest first)
    const sharedKey = generateSharedKey(currentUser._id.toString(), friendId);
    
    const formattedMessages = messages.reverse().map((msg) => {
      let decryptedContent = msg.content;
      let decryptedFileName = msg.fileName;
      
      // Decrypt content if encrypted
      if (isEncrypted(msg.content)) {
        try {
          decryptedContent = decryptMessage(msg.content, sharedKey);
        } catch (err) {
          console.error('Error decrypting message:', err);
          decryptedContent = msg.content; // Fall back to encrypted
        }
      }

      // Decrypt fileName if encrypted
      if (msg.fileName && isEncrypted(msg.fileName)) {
        try {
          decryptedFileName = decryptMessage(msg.fileName, sharedKey);
        } catch (err) {
          console.error('Error decrypting fileName:', err);
          decryptedFileName = msg.fileName; // Fall back to encrypted
        }
      }
      
      return {
        _id: msg._id.toString(),
        sender: {
          id: msg.sender.toString(),
          name: 'User', // Will be set by frontend
        },
        content: decryptedContent,
        type: msg.type,
        timestamp: msg.createdAt,
        fileUrl: msg.fileUrl,
        fileName: decryptedFileName,
        fileSize: msg.fileSize,
        fileType: msg.fileType,
      };
    });

    return NextResponse.json(formattedMessages, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const body = await request.json();
    const { receiverId, content, type, fileUrl, fileName, fileSize, fileType } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Missing content or receiver' }, { status: 400 });
    }

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find receiver - handle both ObjectId string and regular user ID
    let receiverUser: any;
    if (mongoose.Types.ObjectId.isValid(receiverId)) {
      receiverUser = await User.findById(receiverId);
    } else {
      receiverUser = await User.findById(receiverId);
    }
    
    if (!receiverUser) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Generate shared key and encrypt the message
    const sharedKey = generateSharedKey(currentUser._id.toString(), receiverUser._id.toString());
    const encryptedContent = encryptMessage(content, sharedKey);

    const message = await Message.create({
      sender: currentUser._id,
      receiver: receiverUser._id,
      content: encryptedContent, // Store encrypted message
      type: type || 'text',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
    });

    // Return decrypted message to sender for immediate display
    return NextResponse.json(
      {
        _id: message._id.toString(),
        sender: currentUser._id.toString(),
        receiver: receiverUser._id.toString(),
        content, // Return original (decrypted) content
        type: message.type,
        timestamp: message.createdAt,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        fileType: message.fileType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Message Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}