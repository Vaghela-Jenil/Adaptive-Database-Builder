import CreateUserOnSignIn from "@/components/CreateUserOnSignIn";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div>
        <CreateUserOnSignIn />
          {children}
      </div>
    </>
  );
}
