import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseModel } from '@/lib/models/Database';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const databases = await DatabaseModel.find({ createdBy: userId }).select(
      'DatabaseName recordCount formSchema createdAt updatedAt _id'
    );

    return NextResponse.json(databases);
  } catch (error) {
    console.error('Failed to fetch databases:', error);
    return NextResponse.json({ error: 'Failed to fetch databases' }, { status: 500 });
  }
}
