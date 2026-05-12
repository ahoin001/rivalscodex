import type { ReactNode } from "react";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="lab-light-theme min-h-screen bg-rivals-light-50">{children}</div>;
}
