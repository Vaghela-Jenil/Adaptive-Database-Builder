import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseModel } from '@/lib/models/Database';

export async function GET(
  req: NextRequest,
  { params }: { params: { collectionName: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collectionName } = params;

    // Find database by name for current user
    const database = await DatabaseModel.findOne({
      clerkId: userId,
      DatabaseName: decodeURIComponent(collectionName),
    });

    if (!database) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 404 }
      );
    }

    // Return schema and records
    return NextResponse.json({
      database: {
        _id: database._id.toString(),
        DatabaseName: database.DatabaseName,
        formSchema: database.formSchema || [],
        records: database.records || [],
        totalRecords: database.records?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database' },
      { status: 500 }
    );
  }
}
