import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "LevelUp — Gamified Life Tracker",
  description:
    "Turn training, studying, and habits into a game. Earn XP, build streaks, and watch your stats climb.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LevelUp",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b7cfa",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
