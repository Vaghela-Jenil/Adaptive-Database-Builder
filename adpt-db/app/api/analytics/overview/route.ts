import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseModel } from '@/lib/models/Database';

// GET /api/analytics/overview
// Get combined analytics across all databases
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const databases = await DatabaseModel.find({ createdBy: userId });
    
    let totalRecords = 0;
    let totalFields = 0;
    const databaseStatistics = [];

    for (const db of databases) {
      const recordCount = db.records?.length || 0;
      const fieldCount = db.formSchema?.length || 0;
      
      totalRecords += recordCount;
      totalFields += fieldCount;

      databaseStatistics.push({
        id: db._id,
        name: db.DatabaseName,
        recordCount,
        fieldCount,
        createdAt: db.createdAt,
      });
    }

    return NextResponse.json({
      totalDatabases: databases.length,
      totalRecords,
      totalFields: totalFields / databases.length, // Average
      databases: databaseStatistics,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
