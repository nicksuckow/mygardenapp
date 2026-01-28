import { ui } from "@/lib/uiStyles";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import MobileNav from "@/components/MobileNav";

export const metadata = {
  title: "Garden Planner",
  description: "Plan your garden with dates and a virtual bed layout",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={ui.page}>
        <SessionProvider session={session}>
          <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white md:bg-white/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-white/80">
              <nav className="mx-auto flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
                <Link className="font-semibold text-slate-900 text-sm sm:text-base" href="/">
                  Garden Planner
                </Link>

                {session?.user && (
                  <>
                    {/* Desktop navigation - hidden on mobile */}
                    <div className="hidden md:flex items-center gap-4">
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/settings"
                      >
                        Location Data
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/plants"
                      >
                        Plants
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/seeds"
                      >
                        Seed Inventory
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/beds"
                      >
                        Beds
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/garden"
                      >
                        Garden View
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/schedule"
                      >
                        Schedule
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/plant-now"
                      >
                        Plant Now
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/journal"
                      >
                        Journal
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/seed-swaps"
                      >
                        Seed Swaps
                      </Link>
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/stats"
                      >
                        Statistics
                      </Link>
                    </div>
                  </>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <UserMenu session={session} />
                  {session?.user && <MobileNav />}
                </div>
              </nav>
            </header>

            <main className="mx-auto px-4 sm:px-6 py-4">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
