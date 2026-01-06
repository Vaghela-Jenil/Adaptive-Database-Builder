'use client'
import { useUser } from "@clerk/nextjs";

export default function DashBoardLayout({
    adminDashboard,
    userDashboard,
  children,
}: Readonly<{
    adminDashboard: React.ReactNode;
    userDashboard: React.ReactNode;
  children: React.ReactNode;
}>) {

    const {isLoaded, user} = useUser();

    if(!isLoaded) return;

  return (
        <div>
            {user?.publicMetadata.role === "admin" ? adminDashboard : userDashboard}
        </div>
  );
}
