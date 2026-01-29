"use client";

import { useEffect } from "react";
import { ui } from "@/lib/uiStyles";

export default function HelpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Help page error:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className={`${ui.card} ${ui.cardPad} text-center`}>
        <h2 className="text-lg font-semibold text-earth-deep">Something went wrong</h2>
        <p className="text-earth-warm mt-2">Unable to load the Help page.</p>
        <button
          onClick={reset}
          className={`${ui.btn} ${ui.btnPrimary} mt-4`}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
