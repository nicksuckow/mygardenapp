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
      <body>
        <div className="min-h-screen">
          <header className="border-b">
            <nav className="mx-auto flex max-w-5xl items-center gap-4 p-4">
              <Link className="font-semibold" href="/">
                Garden Planner
              </Link>
              <Link className="text-sm hover:underline" href="/settings">
                Settings
              </Link>
              <Link className="text-sm hover:underline" href="/plants">
                Plants
              </Link>
              <Link className="text-sm hover:underline" href="/beds">
                Beds
              </Link>
              <Link className="text-sm hover:underline" href="/schedule">
                Schedule
              </Link>
            </nav>
          </header>

          <main className="mx-auto max-w-5xl p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
