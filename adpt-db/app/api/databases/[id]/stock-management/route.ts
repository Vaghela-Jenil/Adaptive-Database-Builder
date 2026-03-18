import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import { checkDatabaseAccess } from "@/lib/auth";

/* GET stock management data (out-of-stock items + invoices) */
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

    const id = (await params).id;

    // Check database access with Viewer role (read-only)
    const { database: db } = await checkDatabaseAccess(
      id,
      userId,
      "Viewer"
    );

    return NextResponse.json({
      outOfStockItems: db.outOfStockItems || [],
      generatedInvoices: db.generatedInvoices || [],
    });
  } catch (err: any) {
    console.error(err);
    if (err.message === "Access denied" || err.message === "Database not found") {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}

/* PUT — save stock management data */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    const body = await req.json();
    const { outOfStockItems, generatedInvoices } = body;

    // Check database access with Editor or Admin role required for updating
    const { database: db } = await checkDatabaseAccess(
      id,
      userId,
      "Editor"
    );

    if (outOfStockItems !== undefined) {
      db.outOfStockItems = outOfStockItems;
    }
    if (generatedInvoices !== undefined) {
      db.generatedInvoices = generatedInvoices;
    }

    await db.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    if (err.message === "Insufficient permissions") {
      return NextResponse.json(
        { error: "You don't have permission to save stock data" },
        { status: 403 }
      );
    }
    if (err.message === "Access denied" || err.message === "Database not found") {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to save stock data" }, { status: 500 });
  }
}
