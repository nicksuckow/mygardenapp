import Link from "next/link";
import { ui } from "@/lib/uiStyles";
import WeatherWidget from "@/components/WeatherWidget";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 shadow-sm">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 w-24 h-24 bg-sage-light rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-sage/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Brand logo */}
              <div className="flex-shrink-0 w-14 h-14">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                  {/* Soil/ground curve */}
                  <ellipse cx="60" cy="95" rx="45" ry="12" fill="#6B5B4F"/>
                  {/* Seed in soil */}
                  <ellipse cx="60" cy="88" rx="12" ry="8" fill="#A85A3A"/>
                  {/* Main stem */}
                  <path d="M60 85 Q60 65 60 50" stroke="#5C7A56" strokeWidth="6" strokeLinecap="round"/>
                  {/* Left leaf */}
                  <path d="M60 55 Q45 45 38 30 Q50 35 60 50" fill="#7D9A78"/>
                  {/* Right leaf */}
                  <path d="M60 50 Q75 40 82 25 Q70 32 60 45" fill="#A8C4A2"/>
                  {/* Small emerging leaf at top */}
                  <path d="M60 50 Q55 42 52 35 Q58 38 60 48" fill="#7D9A78"/>
                </svg>
              </div>

              <div>
                <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
                  Sow Plan
                </h1>
                <p className="mt-2 text-earth-warm">
                  Plan your beds, spacing, and planting dates — based on what you actually plant.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link className={`${ui.btn} ${ui.btnPrimary}`} href="/beds">
                Open beds →
              </Link>
              <Link className={`${ui.btn} ${ui.btnSecondary}`} href="/schedule">
                View schedule
              </Link>
              <Link className={`${ui.btn} ${ui.btnSecondary}`} href="/stats">
                Statistics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Weather */}
      <WeatherWidget />

      {/* Main actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${ui.card} ${ui.cardPad} space-y-3 hover:shadow-md transition-shadow duration-200`}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 bg-sage/10 text-sage-dark rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-base font-semibold">1) Set frost dates</h2>
          </div>
          <p className={ui.sub}>
            Add your zone and last spring frost date. Everything else builds from this.
          </p>
          <Link className={`${ui.btn} ${ui.btnSecondary} w-fit`} href="/settings">
            Go to Location Data
          </Link>
        </div>

        <div className={`${ui.card} ${ui.cardPad} space-y-3 hover:shadow-md transition-shadow duration-200`}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 bg-sage/10 text-sage-dark rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V11M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11" />
              </svg>
            </div>
            <h2 className="text-base font-semibold">2) Add plants</h2>
          </div>
          <p className={ui.sub}>
            Save spacing and timing rules so the app can generate your schedule.
          </p>
          <Link className={`${ui.btn} ${ui.btnSecondary} w-fit`} href="/plants">
            Manage plants
          </Link>
        </div>

        <div className={`${ui.card} ${ui.cardPad} space-y-3 hover:shadow-md transition-shadow duration-200`}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 bg-mustard/10 text-mustard-dark rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold">3) Lay out beds</h2>
          </div>
          <p className={ui.sub}>
            Click to place plants in a grid. Your schedule updates automatically.
          </p>
          <Link className={`${ui.btn} ${ui.btnSecondary} w-fit`} href="/beds">
            Plan beds
          </Link>
        </div>
      </div>

      {/* Tip */}
      <div className="relative overflow-hidden rounded-xl border border-sage/20 bg-gradient-to-r from-sage/10 to-sage-light/20 p-5 shadow-sm">
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-24 h-24 text-sage" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22V11M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11" />
          </svg>
        </div>
        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 text-sage-dark">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-earth-deep">
            <span className="font-semibold">Quick Start:</span> Begin with <span className="font-medium">Location Data</span> to set your frost dates, add a couple plants with their spacing and timing info, then place them in a bed to see your first personalized schedule.
          </div>
        </div>
      </div>
    </div>
  );
}
