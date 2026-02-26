import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt"; 

export async function GET(req: NextRequest) {
    await connectDB();
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const client = await clerkClient();
        const caller = await client.users.getUser(userId);
        if (caller.publicMetadata.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "8");
        const offset = parseInt(searchParams.get("offset") || "0");

        const users = await User.find({})
            .select("-password") 
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        const totalCount = await User.countDocuments();

        const formattedUsers = users.map((u) => ({
            id: u.clerkId,
            name: u.userName,
            email: u.email,
            role: u.role,
            imageUrl: u.userImage,
            phonenumber: u.phonenumber,
            createdAt: u.createdAt,
            lastActiveAt: u.updatedAt, 
            status: u.banned ? "banned" : "active", 
        }));

        return NextResponse.json({ data: formattedUsers, totalCount }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password, firstName, lastName, phonenumber } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, first/last name." },
        { status: 400 }
      );
    }

    const generatedUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const client = await clerkClient();

    const clerkUser = await client.users.createUser({
      emailAddress: [email],
      password: password,
      firstName: firstName,
      lastName: lastName,
      username: generatedUsername, 
      publicMetadata: { role: "user" },
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      clerkId: clerkUser.id,
      email: email.toLowerCase(),
      userName: `${firstName} ${lastName}`.trim(),
      role: "user",
      banned: false,
      userImage: clerkUser.imageUrl,
      password: hashedPassword,
      phonenumber: phonenumber || ""
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    console.error("CLERK API ERROR:", error);
    
    const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message;

    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    );
  }
}