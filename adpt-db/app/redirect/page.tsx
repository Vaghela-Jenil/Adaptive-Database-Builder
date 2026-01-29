import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function RedirectPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role =
    user.privateMetadata.role ??
    user.publicMetadata.role ??
    "user";

  if (role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect("/user/dashboard");
}
