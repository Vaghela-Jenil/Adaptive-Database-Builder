import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/UserDashboard/DashboardLayout";

export default async function DashBoard() {
    await requireAuth();
  return (
    <div className="min-h-screen bg-slate-950 relative">
        <DashboardLayout/>
    </div>
  )
}

