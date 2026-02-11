import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  // ✅ auth() is correctly awaited for 2026 standards
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // 🕵️ Check if user exists first to save resources
    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists", user_id: existingUser.clerkId, status: 200 });
    }

    // 👤 Fetch full user details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    // ✨ Create new user in MongoDB
    const newUser = new User({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
      image: clerkUser.imageUrl,
      role: clerkUser.publicMetadata?.role ?? "user",
    });

    await newUser.save();

    return NextResponse.json({ message: "User created", user_id: newUser.clerkId, status: 201 });
  } catch (err: any) {
  console.error("SERVER ERROR:", err.message); // Look at your terminal for this!
  return NextResponse.json({ error: err.message }, { status: 500 });
}
}
