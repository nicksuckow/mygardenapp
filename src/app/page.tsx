import Link from "next/link";
import { ui } from "@/lib/uiStyles";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={`${ui.card} ${ui.cardPad}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={ui.h1}>Garden Planner</h1>
            <p className={ui.sub}>
              Plan your beds, spacing, and planting dates — based on what you actually plant.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className={`${ui.btn} ${ui.btnPrimary}`} href="/beds">
              Open beds →
            </Link>
            <Link className={`${ui.btn} ${ui.btnSecondary}`} href="/schedule">
              View schedule
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
        </div>
      </div>

      {/* Main actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${ui.card} ${ui.cardPad} space-y-2`}>
          <h2 className="text-base font-semibold">1) Set frost dates</h2>
          <p className={ui.sub}>
            Add your zone and last spring frost date. Everything else builds from this.
          </p>
          <Link className={`${ui.btn} ${ui.btnSecondary} w-fit`} href="/settings">
            Go to Location Data
          </Link>
        </div>

        <div className={`${ui.card} ${ui.cardPad} space-y-2`}>
          <h2 className="text-base font-semibold">2) Add plants</h2>
          <p className={ui.sub}>
            Save spacing and timing rules so the app can generate your schedule.
          </p>
          <Link className={`${ui.btn} ${ui.btnSecondary} w-fit`} href="/plants">
            Manage plants
          </Link>
        </div>

        <div className={`${ui.card} ${ui.cardPad} space-y-2`}>
          <h2 className="text-base font-semibold">3) Lay out beds</h2>
          <p className={ui.sub}>
            Click to place plants in a grid. Your schedule updates automatically.
          </p>
          <Link className={`${ui.btn} ${ui.btnSecondary} w-fit`} href="/beds">
            Plan beds
          </Link>
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        Tip: Start with <span className="font-medium">Location Data</span>, then add a couple plants,
        then place them in a bed to see your first schedule.
      </div>
    </div>
  );
}
