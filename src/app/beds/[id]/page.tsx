import BedLayoutClient from "./ui";

export default async function BedLayoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ unwrap params
  const bedId = Number(id);

  if (!Number.isInteger(bedId) || bedId <= 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Invalid bed</h1>
        <p className="text-sm text-gray-600">
          The URL bed id is invalid: <span className="font-mono">{String(id)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Go back to <span className="font-mono">/beds</span> and click a bed card.
        </p>
      </div>
    );
  }

  return <BedLayoutClient bedId={bedId} />;
}
