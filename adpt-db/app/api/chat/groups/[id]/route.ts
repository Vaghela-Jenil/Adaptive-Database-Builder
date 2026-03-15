import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Group } from '@/lib/models/Group';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const groupId = (await params).id;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const group = await Group.findById(new mongoose.Types.ObjectId(groupId));
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // Check if user is in group
    const memberIndex = group.members.findIndex((m) => m.userId.toString() === currentUser._id.toString());
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'User not in group' }, { status: 403 });
    }

    const currentMember = group.members[memberIndex];

    if (mode === 'delete') {
      if (currentMember.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can delete the group' }, { status: 403 });
      }

      await Group.findByIdAndDelete(new mongoose.Types.ObjectId(groupId));
      return NextResponse.json({ message: 'Group deleted' }, { status: 200 });
    }

    // If only one member (creator), delete group entirely
    if (group.members.length === 1) {
      await Group.findByIdAndDelete(new mongoose.Types.ObjectId(groupId));
      return NextResponse.json({ message: 'Group deleted' }, { status: 200 });
    }

    // If user is admin and others exist, transfer admin to first remaining member
    if (currentMember.role === 'admin' && group.members.length > 1) {
      group.members[memberIndex === 0 ? 1 : 0].role = 'admin';
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    await group.save();

    return NextResponse.json({ message: 'Left group' }, { status: 200 });
  } catch (error) {
    console.error('Error exiting group:', error);
    return NextResponse.json({ error: 'Failed to exit group' }, { status: 500 });
  }
}
