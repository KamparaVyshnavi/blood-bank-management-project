import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: { default: "PulseGrid", template: "%s | PulseGrid" },
  description: "Cloud-Based Blood Bank Management & Emergency Coordination Platform.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", apple: "/donor-192.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PulseGrid", statusBarStyle: "default" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const app = <AppShell>{children}</AppShell>;
  return <html lang="en"><body>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY ? <ClerkProvider>{app}</ClerkProvider> : app}</body></html>;
}
