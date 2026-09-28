import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản trị | TC Auto Solutions",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="tc-admin min-h-screen font-sans text-white antialiased">{children}</div>;
}
