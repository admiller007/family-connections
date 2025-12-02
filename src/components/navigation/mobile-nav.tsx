"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavLink } from "@/config/navigation";
import Link from "next/link";

type MobileNavProps = {
  links: NavLink[];
};

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Open menu"
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        Menu
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 mx-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
              Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
