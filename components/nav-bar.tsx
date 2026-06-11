"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/(app)/actions";

const TABS = [
  { href: "/grupos", label: "Fase de grupos", icon: "⚽" },
  { href: "/eliminatorias", label: "Eliminatorias", icon: "🏆" },
  { href: "/tabla", label: "Aciertos", icon: "📊" },
];

export function NavBar({
  username,
  esAdmin,
}: {
  username: string;
  esAdmin: boolean;
}) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  const tabs = esAdmin
    ? [...TABS, { href: "/admin", label: "Usuarios", icon: "👥" }]
    : TABS;

  return (
    <header className="bg-pitch text-white sticky top-0 z-20 shadow-lg">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/grupos" className="flex items-center gap-2 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/trionda.png"
              alt="Trionda"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-white/40"
            />
            <span className="hidden sm:inline">La Polla Mundial 2026</span>
            <span className="sm:hidden">La Polla 2026</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80 hidden sm:inline">
              {username}
              {esAdmin && (
                <span className="ml-1 text-gold text-xs">(admin)</span>
              )}
            </span>
            <form action={logout}>
              <button className="text-sm bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition">
                Salir
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`whitespace-nowrap rounded-t-lg px-3 sm:px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-100 text-pitch"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
