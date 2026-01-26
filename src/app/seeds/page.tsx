"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";
import { scanSeedPacket } from "@/lib/seedPacketOcr";

type Plant = {
  id: number;
  name: string;
  variety: string | null;
};

type Seed = {
  id: number;
  name: string;
  variety: string | null;
  brand: string | null;
  quantity: number;
  seedCount: number | null;
  purchaseDate: string | null;
  expirationDate: string | null;
  lotNumber: string | null;
  notes: string | null;
  sowingInstructions: string | null;
  daysToGermination: number | null;
  germinationRate: number | null;
  status: string;
  plantId: number | null;
  plant: Plant | null;
};

type FormData = {
  name: string;
  variety: string;
  brand: string;
  quantity: number;
  seedCount: string;
  purchaseDate: string;
  expirationDate: string;
  lotNumber: string;
  notes: string;
  sowingInstructions: string;
  daysToGermination: string;
  germinationRate: string;
  status: string;
  plantId: string;
};

const emptyForm: FormData = {
  name: "",
  variety: "",
  brand: "",
  quantity: 1,
  seedCount: "",
  purchaseDate: "",
  expirationDate: "",
  lotNumber: "",
  notes: "",
  sowingInstructions: "",
  daysToGermination: "",
  germinationRate: "",
  status: "available",
  plantId: "",
};

export default function SeedsPage() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Image scanning state
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  async function loadData() {
    try {
      setError("");
      const [seedsRes, plantsRes] = await Promise.all([
        fetch("/api/seeds"),
        fetch("/api/plants"),
      ]);

      if (!seedsRes.ok) {
        const data = await seedsRes.json();
        setError(data.error || "Failed to load seeds");
        return;
      }

      const seedsData = await seedsRes.json();
      const plantsData = plantsRes.ok ? await plantsRes.json() : [];

      setSeeds(seedsData);
      setPlants(plantsData);
    } catch (e) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAddModal() {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEditModal(seed: Seed) {
    setForm({
      name: seed.name,
      variety: seed.variety || "",
      brand: seed.brand || "",
      quantity: seed.quantity,
      seedCount: seed.seedCount?.toString() || "",
      purchaseDate: seed.purchaseDate?.slice(0, 10) || "",
      expirationDate: seed.expirationDate?.slice(0, 10) || "",
      lotNumber: seed.lotNumber || "",
      notes: seed.notes || "",
      sowingInstructions: seed.sowingInstructions || "",
      daysToGermination: seed.daysToGermination?.toString() || "",
      germinationRate: seed.germinationRate?.toString() || "",
      status: seed.status,
      plantId: seed.plantId?.toString() || "",
    });
    setEditingId(seed.id);
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setScanError("Please upload an image file");
      return;
    }

    setScanning(true);
    setScanError("");

    try {
      // Use client-side Tesseract OCR
      const data = await scanSeedPacket(file);

      // Fill in the form with scanned data
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        variety: data.variety || prev.variety,
        brand: data.brand || prev.brand,
        sowingInstructions: data.sowingInstructions || prev.sowingInstructions,
        daysToGermination: data.daysToGermination?.toString() || prev.daysToGermination,
        germinationRate: data.germinationRate?.toString() || prev.germinationRate,
        seedCount: data.seedCount?.toString() || prev.seedCount,
        notes: [
          prev.notes,
          data.plantingDepth ? `Planting depth: ${data.plantingDepth}` : "",
          data.spacing ? `Spacing: ${data.spacing}` : "",
          data.sunlight ? `Sun: ${data.sunlight}` : "",
        ]
          .filter(Boolean)
          .join("\n") || prev.notes,
        expirationDate: data.expirationYear
          ? `${data.expirationYear}-12-31`
          : prev.expirationDate,
      }));

      setScanning(false);
      setShowModal(true);
    } catch (err) {
      setScanError("Failed to scan seed packet. Try a clearer image.");
      setScanning(false);
    }

    // Reset the file input
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let plantId = form.plantId ? parseInt(form.plantId, 10) : null;

    // If adding a new seed and no plant is linked, try to find/import from Verdantly
    if (!editingId && !plantId && form.name.trim()) {
      try {
        // Search Verdantly for matching plant
        const searchQuery = form.variety
          ? `${form.name} ${form.variety}`
          : form.name;
        const searchRes = await fetch(
          `/api/verdantly/search?q=${encodeURIComponent(searchQuery)}`
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();

          if (searchData.results && searchData.results.length > 0) {
            // Found a match - import the first result
            const verdantlyPlant = searchData.results[0];

            const importRes = await fetch("/api/verdantly/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plantData: verdantlyPlant }),
            });

            if (importRes.ok) {
              const importedPlant = await importRes.json();
              plantId = importedPlant.id;
            } else if (importRes.status === 409) {
              // Plant already exists - use the existing one
              const existingData = await importRes.json();
              if (existingData.plant?.id) {
                plantId = existingData.plant.id;
              }
            }
          }
        }
      } catch (err) {
        // Verdantly lookup failed - continue without linking
        console.log("Verdantly lookup failed, continuing without plant link");
      }
    }

    const payload = {
      name: form.name,
      variety: form.variety || null,
      brand: form.brand || null,
      quantity: form.quantity,
      seedCount: form.seedCount ? parseInt(form.seedCount, 10) : null,
      purchaseDate: form.purchaseDate || null,
      expirationDate: form.expirationDate || null,
      lotNumber: form.lotNumber || null,
      notes: form.notes || null,
      sowingInstructions: form.sowingInstructions || null,
      daysToGermination: form.daysToGermination ? parseInt(form.daysToGermination, 10) : null,
      germinationRate: form.germinationRate ? parseFloat(form.germinationRate) : null,
      status: form.status,
      plantId,
    };

    try {
      const url = editingId ? `/api/seeds/${editingId}` : "/api/seeds";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      setShowModal(false);
      loadData();
    } catch (e) {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this seed inventory item?")) return;

    try {
      const res = await fetch(`/api/seeds/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete");
        return;
      }
      loadData();
    } catch (e) {
      setError("Failed to delete");
    }
  }

  // Filter seeds
  const filteredSeeds = seeds.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !(s.variety?.toLowerCase().includes(q)) &&
        !(s.brand?.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const stats = {
    total: seeds.length,
    available: seeds.filter((s) => s.status === "available").length,
    low: seeds.filter((s) => s.status === "low").length,
    empty: seeds.filter((s) => s.status === "empty").length,
    expired: seeds.filter((s) => s.status === "expired").length,
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-200";
      case "low":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "empty":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "expired":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-100 p-6">
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white p-2.5 rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Seed Inventory
            </h1>
            <p className="text-amber-900 text-sm mt-1">
              Track your seed packets, quantities, and expiration dates
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-600">Total</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.available}</p>
          <p className="text-xs text-green-600">Available</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.low}</p>
          <p className="text-xs text-amber-600">Low</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-700">{stats.empty}</p>
          <p className="text-xs text-slate-600">Empty</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center">
          <p className="text-2xl font-bold text-rose-700">{stats.expired}</p>
          <p className="text-xs text-rose-600">Expired</p>
        </div>
      </div>

      {/* Controls */}
      <div className={`${ui.card} ${ui.cardPad}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search seeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm w-48"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="low">Low</option>
              <option value="empty">Empty</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={`${ui.btn} ${ui.btnSecondary} cursor-pointer`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={scanning}
              />
              {scanning ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Scan Packet
                </span>
              )}
            </label>
            <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={openAddModal}>
              + Add Seeds
            </button>
          </div>
        </div>
      </div>

      {scanError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {scanError}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Seed List */}
      {filteredSeeds.length === 0 ? (
        <div className={`${ui.card} ${ui.cardPad} text-center py-12`}>
          <p className="text-slate-600">
            {seeds.length === 0
              ? "No seeds in inventory yet. Add some!"
              : "No seeds match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredSeeds.map((seed) => (
            <div
              key={seed.id}
              className={`${ui.card} ${ui.cardPad} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{seed.name}</h3>
                  {seed.variety && (
                    <p className="text-sm text-slate-600">{seed.variety}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium border capitalize ${getStatusBadge(
                    seed.status
                  )}`}
                >
                  {seed.status}
                </span>
              </div>

              <div className="space-y-1 text-sm mb-3">
                {seed.brand && (
                  <p className="text-slate-600">
                    <span className="font-medium">Brand:</span> {seed.brand}
                  </p>
                )}
                <p className="text-slate-600">
                  <span className="font-medium">Qty:</span> {seed.quantity} packet(s)
                  {seed.seedCount && ` (~${seed.seedCount} seeds/pkt)`}
                </p>
                {seed.expirationDate && (
                  <p className="text-slate-600">
                    <span className="font-medium">Expires:</span>{" "}
                    {new Date(seed.expirationDate).toLocaleDateString()}
                  </p>
                )}
                {seed.plant && (
                  <p className="text-slate-600">
                    <span className="font-medium">Linked to:</span> {seed.plant.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  className={`${ui.btn} ${ui.btnSecondary} text-xs py-1`}
                  onClick={() => openEditModal(seed)}
                >
                  Edit
                </button>
                <button
                  className="text-xs text-rose-600 hover:text-rose-700"
                  onClick={() => handleDelete(seed.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Seed" : "Add Seeds"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded p-1 hover:bg-slate-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Seed Name *</span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="e.g., Tomato"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Variety</span>
                  <input
                    type="text"
                    value={form.variety}
                    onChange={(e) => setForm({ ...form, variety: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="e.g., Beefsteak"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Brand</span>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="e.g., Burpee"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="low">Low</option>
                    <option value="empty">Empty</option>
                    <option value="expired">Expired</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Quantity (packets)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                    className="rounded border px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Seeds per packet</span>
                  <input
                    type="number"
                    min="0"
                    value={form.seedCount}
                    onChange={(e) => setForm({ ...form, seedCount: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="Approximate count"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Purchase Date</span>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Expiration Date</span>
                  <input
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Link to Plant</span>
                <select
                  value={form.plantId}
                  onChange={(e) => setForm({ ...form, plantId: e.target.value })}
                  className="rounded border px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.variety && ` (${p.variety})`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Lot Number</span>
                <input
                  type="text"
                  value={form.lotNumber}
                  onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="From seed packet"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Days to Germination</span>
                  <input
                    type="number"
                    min="0"
                    value={form.daysToGermination}
                    onChange={(e) => setForm({ ...form, daysToGermination: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Germination Rate (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.germinationRate}
                    onChange={(e) => setForm({ ...form, germinationRate: e.target.value })}
                    className="rounded border px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Sowing Instructions</span>
                <textarea
                  value={form.sowingInstructions}
                  onChange={(e) => setForm({ ...form, sowingInstructions: e.target.value })}
                  className="rounded border px-3 py-2 text-sm"
                  rows={2}
                  placeholder="From seed packet..."
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded border px-3 py-2 text-sm"
                  rows={2}
                />
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnSecondary}`}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Add Seeds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
