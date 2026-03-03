import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";

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
    const db = await DatabaseModel.findOne(
      { _id: id, clerkId: userId },
      { outOfStockItems: 1, generatedInvoices: 1 }
    );

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json({
      outOfStockItems: db.outOfStockItems || [],
      generatedInvoices: db.generatedInvoices || [],
    });
  } catch (err) {
    console.error(err);
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

    const db = await DatabaseModel.findOne({ _id: id, clerkId: userId });
    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (outOfStockItems !== undefined) {
      db.outOfStockItems = outOfStockItems;
    }
    if (generatedInvoices !== undefined) {
      db.generatedInvoices = generatedInvoices;
    }

    await db.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save stock data" }, { status: 500 });
  }
}
