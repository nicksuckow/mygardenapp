import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sow Plan",
    short_name: "Sow Plan",
    description:
      "Plan your garden with personalized planting schedules based on your location. Track what you sow, design bed layouts, and manage your growing season.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2", // cream
    theme_color: "#7D9A78", // sage
    orientation: "portrait-primary",
    categories: ["lifestyle", "utilities", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/garden-view.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Garden View - Visualize your entire garden layout",
      },
      {
        src: "/screenshots/schedule.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Planting Schedule - Know when to plant each crop",
      },
    ],
  };
}
