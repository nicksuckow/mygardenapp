import { ui } from "@/lib/uiStyles";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import OnboardingProvider from "@/components/OnboardingProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import type { Metadata } from "next";

const APP_NAME = "Garden Planner";
const APP_DESCRIPTION =
  "Plan your garden with personalized planting schedules based on your location. Track plants, design bed layouts, and manage your growing season.";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "garden planner",
    "planting schedule",
    "garden layout",
    "vegetable garden",
    "frost dates",
    "hardiness zone",
    "seed starting",
    "garden journal",
  ],
  authors: [{ name: "Garden Planner" }],
  creator: "Garden Planner",
  publisher: "Garden Planner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://gardenplanner.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Garden Planner - Plan your garden with personalized planting schedules",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
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
          <ServiceWorkerRegistration />
          <OnboardingProvider />
          <div className="min-h-screen flex flex-col">
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
                      <Link
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                        href="/account"
                      >
                        Account
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

            <main className="mx-auto px-4 sm:px-6 py-4 flex-1 w-full">{children}</main>

            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
