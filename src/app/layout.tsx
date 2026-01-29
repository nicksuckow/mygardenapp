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

const APP_NAME = "Sow Plan";
const APP_DESCRIPTION =
  "Plan your garden with personalized planting schedules based on your location. Track what you sow, design bed layouts, and manage your growing season.";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "sowplan",
    "garden planner",
    "planting schedule",
    "garden layout",
    "vegetable garden",
    "frost dates",
    "hardiness zone",
    "seed starting",
    "garden journal",
  ],
  authors: [{ name: "Sowplan" }],
  creator: "Sowplan",
  publisher: "Sowplan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://sowplan.com"
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
        alt: "Sowplan - Plan your garden with personalized planting schedules",
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
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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
  themeColor: "#7D9A78", // Brand sage color
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
            <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-100 md:bg-cream-100/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-cream-100/80">
              <nav className="mx-auto flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
                <Link className="flex items-center gap-2 font-display font-semibold text-earth-deep text-sm sm:text-lg hover:text-sage-dark transition-colors" href="/">
                  <svg viewBox="0 0 120 120" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="60" cy="95" rx="45" ry="12" fill="#6B5B4F"/>
                    <ellipse cx="60" cy="88" rx="12" ry="8" fill="#A85A3A"/>
                    <path d="M60 85 Q60 65 60 50" stroke="#5C7A56" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M60 55 Q45 45 38 30 Q50 35 60 50" fill="#7D9A78"/>
                    <path d="M60 50 Q75 40 82 25 Q70 32 60 45" fill="#A8C4A2"/>
                    <path d="M60 50 Q55 42 52 35 Q58 38 60 48" fill="#7D9A78"/>
                  </svg>
                  <span className="hidden sm:inline">Sow Plan</span>
                </Link>

                {session?.user && (
                  <>
                    {/* Desktop navigation - hidden on mobile */}
                    <div className="hidden md:flex items-center gap-4">
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/settings"
                      >
                        Location Data
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/plants"
                      >
                        Plants
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/seeds"
                      >
                        Seed Inventory
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/beds"
                      >
                        Beds
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/garden"
                      >
                        Garden View
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/schedule"
                      >
                        Schedule
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/plant-now"
                      >
                        Plant Now
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/journal"
                      >
                        Journal
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/seed-swaps"
                      >
                        Seed Swaps
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
                        href="/stats"
                      >
                        Statistics
                      </Link>
                      <Link
                        className="text-sm text-earth-warm hover:text-sage-dark hover:underline transition-colors"
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
