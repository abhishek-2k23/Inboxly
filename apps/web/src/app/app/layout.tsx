import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="bg-page flex h-screen overflow-hidden">
      <AppNav />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      <KeyboardShortcuts />
    </div>
  );
}
