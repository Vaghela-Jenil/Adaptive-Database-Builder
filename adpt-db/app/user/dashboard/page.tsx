import CreateUserOnSignIn from "@/components/CreateUserOnSignIn";
import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/UserDashboard/DashboardLayout";
export default async function DashBoard() {
    requireAuth();
  return (
    <div className="min-h-screen bg-slate-950 relative">
        <CreateUserOnSignIn/>
        <DashboardLayout/>
    </div>
  )
}

