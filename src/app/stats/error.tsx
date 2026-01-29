"use client";

export default function StatsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="bg-terracotta-50 border border-terracotta/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-terracotta-dark mb-2">
          Statistics Error
        </h2>
        <p className="text-terracotta mb-4">
          Failed to load your garden statistics. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-terracotta text-white rounded hover:bg-terracotta-dark transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
