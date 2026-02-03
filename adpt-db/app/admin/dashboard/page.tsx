import AdminLayout from "@/components/AdminDashboard/AdminLayout";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
    await requireAdmin();
    return (
       <div className="min-h-screen bg-slate-950 relative">
               <AdminLayout />
            </div>
    )
}