import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST() {
  await connectDB();
  
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (clerkUser.banned) {
      return NextResponse.json({ 
        error: "Access Denied: Your account is restricted.",
        isBanned: true 
      }, { status: 403 });
    }

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const firstName = clerkUser.firstName || "";
      const lastName = clerkUser.lastName || "";
      const salt = await bcrypt.genSalt(10);
      const placeholderPassword = await bcrypt.hash(Math.random().toString(36), salt);

      user = await User.create({
        clerkId: userId,
        email: email,
        userName: `${firstName} ${lastName}`.trim(),
        userImage: clerkUser.imageUrl,
        role: clerkUser.publicMetadata.role || "user",
        password: placeholderPassword,
        phonenumber: clerkUser.phoneNumbers[0]?.phoneNumber || ""
      });

      console.log(`New user created in DB: ${user.email}`);
    } else {
      user.userImage = clerkUser.imageUrl;
      user.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({ 
      message: "User verified and synced", 
      user: user 
    }, { status: 200 });

  } catch (err: any) {
    console.error("AUTH_VERIFY_ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}