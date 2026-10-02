"use client";

import { asset } from "@/lib/asset-version";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavSpec } from "@/lib/types";
import { MobileTree } from "@/components/mobile/MobileTree";
import { buildTree, type TreeNode } from "@/lib/mobile-tree";

/**
 * Cay trang con cua tung muc cha, dung MOT lan khi nap module.
 *
 * Dung san thay vi tinh trong than component: MobileNav nam tren MOI trang,
 * dung lai cay o moi lan ve lai la viec thua.
 */
const TREES: Readonly<Record<string, readonly TreeNode[]>> = Object.fromEntries(
  ["trai-nghiem", "giai-phap", "cong-nghe", "dai-ly", "nhan-su"].map((slug) => [
    `/${slug}`,
    buildTree(slug),
  ]),
);

/**
 * Thanh dieu huong cho dien thoai: logo + nut mo ngan keo.
 *
 * Ban desktop dung thanh nav ngang cua thiet ke; tren dien thoai thanh do bi
 * thu con vai pixel nen phai co ban rieng.
 */
export function MobileNav({ nav }: { nav: readonly NavSpec[] }) {
  const [open, setOpen] = useState(false);
  /** Muc nao trong ngan keo dang xoe trang con ra. Chi mot muc mot luc. */
  const [branch, setBranch] = useState<string | null>(null);
  const bar = useRef<HTMLElement>(null);

  // Ngan keo phai dinh sat DAY thanh header.
  //
  // Truoc day CSS ghi cung `inset: 62px 0 auto` — tuc la doan thanh header
  // luon cao dung 62px. Khong dung: chieu cao cua no do logo va phan dem
  // quyet dinh, va doi theo be ngang man hinh. O may be ngang thanh cao hon
  // 62px, va giua thanh voi ngan keo ho ra mot khe nhin thau xuong trang —
  // khach chup lai (02/10/2026).
  //
  // Do that bang `ResizeObserver` roi ghi vao bien CSS. Do khi MO ngan keo la
  // khong du: xoay ngang may hay doi be ngang cua so thi thanh doi chieu cao
  // ma khe lai ho ra.
  useEffect(() => {
    const node = bar.current;
    if (!node) {
      return;
    }
    const apply = () => {
      document.documentElement.style.setProperty(
        "--tc-m-bar-h",
        `${Math.round(node.getBoundingClientRect().height)}px`,
      );
    };
    apply();
    const watcher = new ResizeObserver(apply);
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  // Mo ngan keo thi khoa cuon nen, va Esc dong lai.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="tc-m-bar" ref={bar}>
        <Link href="/" className="tc-m-logo" aria-label="TC Auto Solutions — trang chủ">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG tinh */}
          <img
            src={asset("/brand/logo-horizontal-on-dark.png")}
            alt="TC Auto Solutions"
            width={132}
            height={30}
          />
        </Link>

        <button
          type="button"
          className="tc-m-burger"
          aria-expanded={open}
          aria-controls="tc-m-drawer"
          onClick={() => setOpen((current) => !current)}
        >
          <span aria-hidden="true" />
          <span className="tc-sr">{open ? "Đóng menu" : "Mở menu"}</span>
        </button>
      </header>

      <div
        id="tc-m-drawer"
        className="tc-m-drawer"
        data-open={open || undefined}
        hidden={!open}
      >
        {/* Moi muc cha deu co trang con, nhung truoc day ngan keo chi liet ke
            SAU muc cha — muon biet trong "Công nghệ" co gi thi phai vao trang
            do da. Nay bam mui ten la xoe ca cay ra ngay tai day. */}
        <nav aria-label="Menu chính">
          {nav.map((link) => {
            const children = TREES[link.href] ?? [];
            const id = `tc-m-branch-${link.href.replace(/[^a-z0-9]+/gi, "-")}`;
            const expanded = branch === link.href;
            return (
              <div className="tc-m-navrow" key={link.href}>
                <div className="tc-m-navhead">
                  <Link
                    href={link.href}
                    prefetch={false}
                    data-active={link.active || undefined}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {children.length > 0 ? (
                    <button
                      type="button"
                      className="tc-m-navtoggle"
                      aria-expanded={expanded}
                      aria-controls={id}
                      aria-label={
                        expanded
                          ? `Thu gọn ${link.label}`
                          : `Mở ${children.length} trang trong ${link.label}`
                      }
                      onClick={() =>
                        setBranch((current) => (current === link.href ? null : link.href))
                      }
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <path
                          d="M4 6 L8 10.5 L12 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {children.length > 0 ? (
                  <div id={id} className="tc-m-navbranch" hidden={!expanded}>
                    <MobileTree nodes={children} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      {open ? (
        <button
          type="button"
          className="tc-m-scrim"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
