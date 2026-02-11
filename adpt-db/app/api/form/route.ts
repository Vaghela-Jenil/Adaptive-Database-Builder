import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FormModel } from "@/lib/models/form-schema";
import { auth } from "@clerk/nextjs/server";


export async function POST(req: NextRequest) {
  try {
    await connectDB();
  const { userId } = await auth();
    const body = await req.json();
    const { formName, fields } = body;

    const form = await FormModel.create({
      clerkId: userId,
      formName,
      fields,
    });

    form.save();
    return NextResponse.json(form, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

     const { userId } = await auth();

    const forms = await FormModel.find({ clerkId: userId });

    return NextResponse.json(forms);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
