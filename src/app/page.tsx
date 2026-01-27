import Link from "next/link";
import { ui } from "@/lib/uiStyles";
import WeatherWidget from "@/components/WeatherWidget";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-100 shadow-sm">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 w-24 h-24 bg-green-200 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-emerald-200 rounded-full blur-3xl"></div>
        </div>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Plant icon */}
              <div className="flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-500 text-white p-3 rounded-xl shadow-md">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V11"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11"/>
                </svg>
              </div>

              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  🌱 Garden Planner
                </h1>
                <p className="mt-2 text-emerald-800">
                  Plan your beds, spacing, and planting dates — based on what you actually plant.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" href="/beds">
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
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
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
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
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
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
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
      <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-24 h-24 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22V11M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11" />
          </svg>
        </div>
        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 text-emerald-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-emerald-900">
            <span className="font-semibold">Quick Start:</span> Begin with <span className="font-medium">Location Data</span> to set your frost dates, add a couple plants with their spacing and timing info, then place them in a bed to see your first personalized schedule.
          </div>
        </div>
      </div>
    </div>
  );
}
