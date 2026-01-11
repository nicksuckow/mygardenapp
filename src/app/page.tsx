export default function HomePage() {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Garden Planner</h1>
        <p className="text-sm text-gray-600">
          Set frost dates, add plants, create beds, then lay out your garden.
        </p>
  
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm">
            1) Set your frost dates in <span className="font-medium">Settings</span>
          </p>
          <p className="text-sm">
            2) Add plants and rules in <span className="font-medium">Plants</span>
          </p>
          <p className="text-sm">
            3) Create a bed and place plants in <span className="font-medium">Beds</span>
          </p>
          <p className="text-sm">
            4) See your timeline in <span className="font-medium">Schedule</span>
          </p>
        </div>
      </div>
    );
  }
  