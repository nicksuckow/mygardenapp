import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sowplan",
    short_name: "Sowplan",
    description:
      "Plan your garden with personalized planting schedules based on your location. Track what you sow, design bed layouts, and manage your growing season.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669", // emerald-600
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
