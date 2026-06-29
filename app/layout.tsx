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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved/system theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('levelup:theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
