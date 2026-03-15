import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Group } from '@/lib/models/Group';
import { User } from '@/lib/models/Users';
import mongoose from 'mongoose';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const groupId = (await params).id;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, memberId } = body;

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const group = await Group.findById(new mongoose.Types.ObjectId(groupId));
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Check if current user is admin
    const currentMember = group.members.find((m) => m.userId.toString() === currentUser._id.toString());
    if (!currentMember || currentMember.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage members' }, { status: 403 });
    }

    if (action === 'add') {
      // Add new member to group
      const member = mongoose.Types.ObjectId.isValid(memberId)
        ? await User.findById(memberId)
        : await User.findOne({ clerkId: memberId });
      if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

      // Check if already in group
      if (group.members.find((m) => m.userId.toString() === member._id.toString())) {
        return NextResponse.json({ error: 'Member already in group' }, { status: 400 });
      }

      group.members.push({
        userId: member._id,
        userName: member.userName,
        userImage: member.userImage,
        role: 'member',
        blockedMembers: [],
      });

      await group.save();
      return NextResponse.json(group, { status: 200 });
    } else if (action === 'remove') {
      // Remove member from group
      const removeId = mongoose.Types.ObjectId.isValid(memberId)
        ? memberId
        : (await User.findOne({ clerkId: memberId }))?._id?.toString();

      if (!removeId) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      group.members = group.members.filter((m) => m.userId.toString() !== removeId);
      await group.save();
      return NextResponse.json(group, { status: 200 });
    } else if (action === 'block') {
      // Block member
      const blockId = mongoose.Types.ObjectId.isValid(memberId)
        ? memberId
        : (await User.findOne({ clerkId: memberId }))?._id?.toString();

      if (!blockId) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      const memberToBlock = group.members.find((m) => m.userId.toString() === blockId);
      if (!memberToBlock) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

      if (!currentMember.blockedMembers.includes(memberToBlock.userId)) {
        currentMember.blockedMembers.push(memberToBlock.userId);
      }

      await group.save();
      return NextResponse.json(group, { status: 200 });
    } else if (action === 'unblock') {
      // Unblock member
      const unblockId = mongoose.Types.ObjectId.isValid(memberId)
        ? memberId
        : (await User.findOne({ clerkId: memberId }))?._id?.toString();

      if (!unblockId) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      currentMember.blockedMembers = currentMember.blockedMembers.filter(
        (id) => id.toString() !== unblockId
      );
      await group.save();
      return NextResponse.json(group, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing group members:', error);
    return NextResponse.json({ error: 'Failed to manage members' }, { status: 500 });
  }
}
