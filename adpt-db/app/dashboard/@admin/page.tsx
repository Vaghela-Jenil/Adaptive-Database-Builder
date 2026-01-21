import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@clerk/nextjs";

export default async function AdminPage() {
    await requireAdmin();
    return (
       <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-6 rounded-xl">
                   <h1>Admin Dashboard</h1>
                   <SignOutButton/>
                </div>
            </div>
    )
}