import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  await connectDB();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    let user = await User.findOne({ clerkId: userId });

    if (user) {
      user.userImage = clerkUser.imageUrl || null;
      await user.save();
      return NextResponse.json({ message: "User updated", user: user, status: 200 });
    } else {
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        userName: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
        userImage: clerkUser.imageUrl || null,
        role: clerkUser.publicMetadata?.role ?? "user",
      });
      return NextResponse.json({ message: "User created", user: user, status: 201 });
    }
  
  } catch (err: any) {
    console.error("SERVER ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
