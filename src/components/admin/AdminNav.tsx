"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  Layers,
  Image as ImageIcon,
  LayoutDashboard,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Tổng quan", Icon: LayoutDashboard },
  { href: "/admin/content", label: "Nội dung trang", Icon: FileText },
  { href: "/admin/posts", label: "Bài viết", Icon: Newspaper },
  { href: "/admin/subpages", label: "Trang con", Icon: Layers },
  { href: "/admin/leads", label: "Khách hàng", Icon: Users },
  { href: "/admin/media", label: "Thư viện media", Icon: ImageIcon },
  { href: "/admin/activity", label: "Nhật ký", Icon: Activity },
  { href: "/admin/settings", label: "Cài đặt", Icon: Settings },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Điều hướng quản trị">
      {LINKS.map(({ href, label, Icon }) => {
        // "/admin" chi active khi trung tuyet doi, tranh sang o moi trang con.
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition " +
              (active
                ? "bg-brand/18 text-white ring-1 ring-inset ring-brand/35"
                : "text-white/55 hover:bg-white/5 hover:text-white")
            }
          >
            <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
