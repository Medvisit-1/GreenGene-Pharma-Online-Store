import type { Metadata } from "next";

// Makes the admin panel installable as a desktop app (Chrome/Edge "Install"). Scoped to /admin only;
// no service worker, so nothing from the admin is cached on the device.
export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
