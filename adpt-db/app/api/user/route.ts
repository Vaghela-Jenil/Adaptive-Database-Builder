import { User } from "@/lib/models/Users";
import { connectDB } from "@/lib/mongodb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    await connectDB();
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const user = await User.findOne({ clerkId: userId });

        const clerkUser = await currentUser();
            
        if (!clerkUser) {
             return NextResponse.json({ error: "User data not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: user.clerkId,
            email: user.email,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password,
            userImage: user.userImage,
            createdAt: user.createdAt,
            role: user.role,
        },
            {
                status: 200,
            });

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}
