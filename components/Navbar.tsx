"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarIcon,
  ChartIcon,
  LogoutIcon,
  PlusIcon,
  TicketIcon,
} from "@/components/Icons";

const links = [
  { href: "/events", label: "Discover", Icon: CalendarIcon },
  { href: "/tickets", label: "My tickets", Icon: TicketIcon },
  { href: "/events/new", label: "Create", Icon: PlusIcon },
  { href: "/manage", label: "Manage", Icon: ChartIcon },
];

export function Navbar({ name }: { name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/events" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d1410c] font-bold text-white">
            E
          </span>
          <span className="hidden text-sm font-bold text-slate-800 sm:inline">
            Evently
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                  active
                    ? "bg-[#fdf0e9] text-[#d1410c]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              {name.slice(0, 1).toUpperCase()}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <p className="truncate border-b border-slate-100 px-4 py-3 text-sm font-semibold">
                  {name}
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
