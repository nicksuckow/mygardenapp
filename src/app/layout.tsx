import { ui } from "@/lib/uiStyles";
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Garden Planner",
  description: "Plan your garden with dates and a virtual bed layout",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ui.page}>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <nav className="mx-auto flex max-w-5xl items-center gap-4 p-4">
              <Link className="font-semibold text-slate-900" href="/">
                Garden Planner
              </Link>

              <Link className="text-sm text-slate-700 hover:text-slate-900 hover:underline" href="/settings">
                Location Data
              </Link>
              <Link className="text-sm text-slate-700 hover:text-slate-900 hover:underline" href="/plants">
                Plants
              </Link>
              <Link className="text-sm text-slate-700 hover:text-slate-900 hover:underline" href="/beds">
                Beds
              </Link>
              <Link className="text-sm text-slate-700 hover:text-slate-900 hover:underline" href="/schedule">
                Schedule
              </Link>
              <Link className="text-sm hover:underline" href="/garden">
                Garden View
              </Link>

            </nav>
          </header>

          <main className="mx-auto max-w-5xl p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
