import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcrypt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const id = (await params).id;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();

    const db = await DatabaseModel.findOne({
      _id: id,
      clerkId: userId,
    });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }
    

    if (!db.hasPassword || !db.password) {
      return NextResponse.json({
        verified: true,
        hasPassword: false,
      });
    }

    const valid = await bcrypt.compare(password, db.password);

   if(valid){
     return NextResponse.json({
      verified: valid,
      hasPassword: true,
    });
   }else{
     return NextResponse.json({
      verified: false,
      hasPassword: true,
    });
   }
    
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
