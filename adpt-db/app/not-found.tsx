import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PageNotFound() {
  const { userId } = await auth();

  if (userId) {
    redirect("/user/dashboard");
  }

  redirect("/");
}



// "use client";

// import { StatusPage } from "@/components/status-page";
// import { Search, Home } from "lucide-react";

// export default function NotFound() {
//   return (
//     <StatusPage
//       code="404"
//       title="Page Not Found"
//       description="The page you're looking for doesn't exist or has been moved."
//       icon={Search}
//       primaryAction={{
//         label: "Back to Dashboard",
//         href: "/user/dashboard",
//         icon: Home,
//       }}
//       secondaryAction={{
//         label: "Go Back",
//         onClick: () => window.history.back(),
//         icon:undefined,
//       }}
//     />
//   );
// }