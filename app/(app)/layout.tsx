import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await usuarioActual();
  if (!u) redirect("/login");

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <NavBar username={u.username} esAdmin={u.es_admin} />
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-3 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
