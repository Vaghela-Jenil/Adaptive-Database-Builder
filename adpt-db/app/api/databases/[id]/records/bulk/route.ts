import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";

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

        const id = (await params).id;
        const { records } = await req.json();

        if (!records || !Array.isArray(records)) {
            return NextResponse.json(
                { error: "Invalid data format. Expected an array of records." },
                { status: 400 }
            );
        }

        const recordsToInsert = records.map((data) => ({
            id: crypto.randomUUID(),
            data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        const updatedDatabase = await DatabaseModel.findByIdAndUpdate(
            {_id : id,
            clerkId: userId},
            {
                $push: { records: { $each: recordsToInsert } },
            },
            { new: true }
        );

        if (!updatedDatabase) {
            return NextResponse.json(
                { error: "Database not found." },
                { status: 404 }
            );
        }

        updatedDatabase.recordCount = recordsToInsert.length;
        updatedDatabase.recordCount = updatedDatabase.records.length;
        updatedDatabase.save();

        return NextResponse.json(
            {
                message: "Bulk import successful",
                count: recordsToInsert.length
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}