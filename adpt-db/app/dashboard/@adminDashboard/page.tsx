import { SignOutButton } from "@clerk/nextjs";

export default function AdminPage() {
    
    return (
       <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-6 rounded-xl">
                   <h1>Admin Dashboard</h1>
                   <SignOutButton/>
                </div>
            </div>
    )
}