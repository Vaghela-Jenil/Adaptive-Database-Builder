import { SignOutButton } from "@clerk/nextjs";
export default async function DashBoard() {

  return (
     <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-6 rounded-xl">
                   <h1>DashBoard</h1>
                   <SignOutButton/>
                </div>
            </div>
  )
}