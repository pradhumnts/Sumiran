export default function manifest() {
  return {
    id: "/",
    name: "Sumiran — Naam Jaap Counter",
    short_name: "Sumiran",
    description: "Track your daily Naam Jaap practice with Sumiran.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f2eb",
    theme_color: "#f7f2eb",
    categories: ["lifestyle", "health"],
    icons: [
      {
        src: "/logo/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
