import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { computeColumnValue } from "@/lib/computedColumns";
import { FieldAttributes } from "@/components/DatabaseBuilder/types";
import { ComputedColumnField } from "@/components/DatabaseBuilder/ComputedColumnPanel";
import { checkDatabaseAccess } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { column, fieldAttribute } = await req.json();
    const databaseId = (await params).id;

    // Validate input
    if (!column || !fieldAttribute) {
      return NextResponse.json(
        { error: "Column and fieldAttribute are required" },
        { status: 400 }
      );
    }

    // Check database access with Editor or Admin role required
    const { database: db } = await checkDatabaseAccess(
      databaseId,
      userId,
      "Editor"
    );

    // Check if field already exists
    const fieldExists = db.formSchema.some(
      (f: FieldAttributes) => f.label.toLowerCase() === column.name.toLowerCase()
    );

    if (fieldExists) {
      return NextResponse.json(
        { error: "A field with this name already exists" },
        { status: 400 }
      );
    }

    // Validate that source fields exist
    const invalidFields = column.sourceFields.filter(
      (fieldId: string) => !db.formSchema.some((f: FieldAttributes) => f.id === fieldId)
    );

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Invalid source fields: ${invalidFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Add the new field to formSchema
    const newField: FieldAttributes = {
      ...fieldAttribute,
      id: column.id,
      label: column.name,
    };

    db.formSchema.push(newField);

    // Initialize computedColumns array if it doesn't exist
    if (!db.computedColumns) {
      db.computedColumns = [];
    }

    // Store the computed column configuration
    db.computedColumns.push({
      id: column.id,
      name: column.name,
      operation: column.operation,
      sourceFields: column.sourceFields,
      formula: column.formula || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Calculate values for all existing records
    const updatedRecords = db.records.map((record: any) => {
      const computedValue = computeColumnValue(record.data, column, db.formSchema);
      return {
        ...record,
        data: {
          ...record.data,
          [column.id]: computedValue,
        },
        updatedAt: new Date().toISOString(),
      };
    });

    // Update the database with new schema, computed columns config, and updated records
    db.formSchema = db.formSchema;
    db.records = updatedRecords;

    await db.save();

    return NextResponse.json(
      {
        message: "Computed column created successfully",
        column: {
          id: column.id,
          name: column.name,
          operation: column.operation,
          sourceFields: column.sourceFields,
        },
        recordsUpdated: updatedRecords.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating computed column:", error);
    if (error.message === "Insufficient permissions") {
      return NextResponse.json(
        { error: "You don't have permission to create computed columns" },
        { status: 403 }
      );
    }
    if (error.message === "Access denied" || error.message === "Database not found") {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create computed column", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve computed columns for a database
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const databaseId = (await params).id;

    // Check database access with Viewer role (read-only for viewers)
    const { database: db } = await checkDatabaseAccess(
      databaseId,
      userId,
      "Viewer"
    );

    const computedColumns = db.computedColumns || [];

    return NextResponse.json(
      {
        computedColumns,
        count: computedColumns.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching computed columns:", error);
    if (error.message === "Access denied" || error.message === "Database not found") {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch computed columns", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a computed column
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { columnId } = await req.json();
    const databaseId = (await params).id;

    if (!columnId) {
      return NextResponse.json(
        { error: "Column ID is required" },
        { status: 400 }
      );
    }

    const db = await DatabaseModel.findOne({
      _id: databaseId,
      clerkId: userId,
    });

    if (!db) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    // Capture old labels before deletion for synonym-cache invalidation
    const oldLabels: string[] = (db.formSchema ?? []).map(
      (f: FieldAttributes) => f.label
    ).filter(Boolean);

    // Remove from formSchema
    db.formSchema = db.formSchema.filter((f: FieldAttributes) => f.id !== columnId);

    // Remove from computedColumns
    if (db.computedColumns) {
      db.computedColumns = db.computedColumns.filter(
        (col: any) => col.id !== columnId
      );
    }

    // Remove the column data from all records
    const updatedRecords = db.records.map((record: any) => {
      const { [columnId]: removed, ...rest } = record.data;
      return {
        ...record,
        data: rest,
        updatedAt: new Date().toISOString(),
      };
    });

    db.records = updatedRecords;
    await db.save();

    // Invalidate stale synonym cache (best-effort, non-blocking)
    if (oldLabels.length > 0) {
      axios.post("http://localhost:5001/api/invalidate-synonym-cache", { old_labels: oldLabels }).catch(() => {});
    }

    return NextResponse.json(
      { message: "Computed column deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting computed column:", error);
    return NextResponse.json(
      { error: "Failed to delete computed column", details: error.message },
      { status: 500 }
    );
  }
}
