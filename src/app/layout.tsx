import { ui } from "@/lib/uiStyles";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

export const metadata = {
  title: "Garden Planner",
  description: "Plan your garden with dates and a virtual bed layout",
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
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
              <nav className="mx-auto flex items-center gap-4 px-6 py-4">
                <Link className="font-semibold text-slate-900" href="/">
                  Garden Planner
                </Link>

                {session?.user && (
                  <>
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
                      href="/beds"
                    >
                      Beds
                    </Link>
                    <Link
                      className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                      href="/schedule"
                    >
                      Schedule
                    </Link>
                    <Link className="text-sm hover:underline" href="/garden">
                      Garden View
                    </Link>
                  </>
                )}

                <div className="ml-auto">
                  <UserMenu session={session} />
                </div>
              </nav>
            </header>

            <main className="mx-auto px-6 py-4">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
