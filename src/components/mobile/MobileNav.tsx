"use client";

import { asset } from "@/lib/asset-version";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavSpec } from "@/lib/types";

/**
 * Thanh dieu huong cho dien thoai: logo + nut mo ngan keo.
 *
 * Ban desktop dung thanh nav ngang cua thiet ke; tren dien thoai thanh do bi
 * thu con vai pixel nen phai co ban rieng.
 */
export function MobileNav({ nav }: { nav: readonly NavSpec[] }) {
  const [open, setOpen] = useState(false);

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
      <header className="tc-m-bar">
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
        <nav aria-label="Menu chính">
          {nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              data-active={link.active || undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
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
