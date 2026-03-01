import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseModel } from '@/lib/models/Database';

// POST /api/analytics/detailed
// Get detailed analytics for selected databases with field aggregations
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { databaseIds, fieldIds, aggregationType = 'all' } = await req.json();

    const query: any = { createdBy: userId };
    if (databaseIds && databaseIds.length > 0) {
      query._id = { $in: databaseIds };
    }

    const databases = await DatabaseModel.find(query);
    const analytics: any = {};

    for (const db of databases) {
      const dbAnalytics: any = {
        name: db.DatabaseName,
        totalRecords: db.records?.length || 0,
        fields: {},
      };

      // Get analytics for selected fields
      const fieldsToAnalyze = fieldIds && fieldIds.length > 0
        ? db.formSchema?.filter((f: any) => fieldIds.includes(f.id))
        : db.formSchema;

      for (const field of fieldsToAnalyze || []) {
        if (field.type === 'text' || field.type === 'separator') continue;

        const fieldValues = (db.records || []).map((r: any) => r.data[field.id]).filter(Boolean);

        dbAnalytics.fields[field.id] = {
          label: field.label,
          type: field.type,
          totalValues: fieldValues.length,
          uniqueValues: new Set(fieldValues).size,
          values: fieldValues,
        };

        // Numeric aggregations
        if (field.type === 'input-number' || field.type === 'slider') {
          const numValues = fieldValues.map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v));
          if (numValues.length > 0) {
            dbAnalytics.fields[field.id].numeric = {
              sum: numValues.reduce((a: number, b: number) => a + b, 0),
              avg: numValues.reduce((a: number, b: number) => a + b, 0) / numValues.length,
              min: Math.min(...numValues),
              max: Math.max(...numValues),
              count: numValues.length,
            };
          }
        }
      }

      analytics[db._id.toString()] = dbAnalytics;
    }

    return NextResponse.json({ analytics, databaseCount: databases.length });
  } catch (error) {
    console.error('Detailed analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch detailed analytics' }, { status: 500 });
  }
}
