import { MobileNav } from "@/components/navigation/mobile-nav";
import { ProtectedContent } from "@/components/protected-content";
import { appNavLinks } from "@/config/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-base font-semibold text-slate-900 sm:text-lg">
            Family Connections
          </Link>
          <nav className="hidden items-center gap-3 text-sm font-medium text-slate-600 sm:flex">
            {appNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            <button className="rounded-full border border-slate-200 px-4 py-1 font-semibold text-slate-700 transition hover:bg-slate-100">
              Sign out
            </button>
          </nav>
          <MobileNav links={appNavLinks} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6">
        <ProtectedContent>{children}</ProtectedContent>
      </main>
    </div>
  );
}
