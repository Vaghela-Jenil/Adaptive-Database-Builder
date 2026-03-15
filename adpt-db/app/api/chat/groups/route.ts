import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Group } from '@/lib/models/Group';
import { GroupMessage } from '@/lib/models/GroupMessage';
import { User } from '@/lib/models/Users';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get all groups where user is a member
    const groups = await Group.find({
      'members.userId': currentUser._id,
    }).sort({ updatedAt: -1 });

    const groupsWithLastMessage = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await GroupMessage.findOne({ groupId: group._id })
          .sort({ createdAt: -1 })
          .select('content type senderName createdAt')
          .lean();

        return {
          ...group.toObject(),
          lastMessage: lastMessage?.content || null,
          lastMessageType: lastMessage?.type || null,
          lastMessageSenderName: lastMessage?.senderName || null,
          lastMessageTime: lastMessage?.createdAt || null,
        };
      })
    );

    return NextResponse.json(groupsWithLastMessage, { status: 200 });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const body = await request.json();
    const { name, memberIds, description } = body;

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json({ error: 'Missing group name or members' }, { status: 400 });
    }

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Build members array with creator as admin
    const members = [
      {
        userId: currentUser._id,
        userName: currentUser.userName,
        userImage: currentUser.userImage,
        role: 'admin',
        blockedMembers: [],
      },
    ];

    // Add selected members
    for (const memberId of memberIds) {
      const member = await User.findById(memberId);
      if (member) {
        members.push({
          userId: member._id,
          userName: member.userName,
          userImage: member.userImage,
          role: 'member',
          blockedMembers: [],
        });
      }
    }

    const group = await Group.create({
      name,
      description: description || null,
      members,
      createdBy: currentUser._id,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
