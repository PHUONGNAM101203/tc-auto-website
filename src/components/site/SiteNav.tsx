"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { submenuFor } from "@/lib/nav-menu";
import type { NavSpec } from "@/lib/types";

/**
 * Thanh dieu huong: menu con xo xuong khi ro chuot, va mot thanh truot danh dau
 * muc dang xem.
 *
 * ── Vi sao KHONG boc moi muc vao mot the div ────────────────────────────────
 * Cach tu nhien la boc moi muc vao mot wrapper roi dat toa do len wrapper.
 * Nhung `.nv` nam trong khoi PROTOTYPE cua canvas.css — khoi khong duoc sua —
 * va no dang la `position: absolute` an theo `.hdr`. Boc them mot lop la doi
 * goc toa do, doi luon cach `padding`/`margin-left` am cua no an vao bo cuc,
 * va chu se xe dich vai pixel so voi thiet ke.
 *
 * Nen o day cac the `.nv` VAN la con truc tiep, VAN tuyet doi theo `.hdr`,
 * khong doi mot thuoc tinh nao. Bang xo xuong la the ANH EM dat cung toa do x,
 * nam ngay duoi day cua nhan (48px + 26px = 74px) nen con tro di tu nhan xuong
 * bang khong bao gio roi ra ngoai.
 *
 * ── Vi sao thanh truot la mot phan tu rieng ─────────────────────────────────
 * Truoc day nen sang + vien cua muc dang xem nam ngay tren `.nv.act`, ma nen
 * thi khong truot duoc: doi muc la no nhay cai roi sang cho khac. Gio nen do
 * tach ra thanh mot phan tu, do dung vi tri muc dang xem roi truot toi.
 * `.nv.act` van giu nguyen padding va margin cua no, thanh truot lay dung
 * offsetLeft/offsetWidth cua chinh the do — nen trang thai tinh khong doi mot
 * pixel nao.
 */

interface SiteNavProps {
  readonly nav: readonly NavSpec[];
}

/** Khoang tre truoc khi dong menu — de con tro kip di tu nhan xuong bang. */
const CLOSE_DELAY_MS = 180;

/**
 * `useLayoutEffect` canh bao khi chay o phia may chu. Component nay co "use
 * client" nhung Next VAN dung san HTML cua no tren may chu, nen phai doi sang
 * `useEffect` o do. Do dung phep do truoc khi trinh duyet ve, neu dung
 * `useEffect` thi nguoi dung kip thay thanh truot nhay mot cai.
 */
const useMeasureEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SiteNav({ nav }: SiteNavProps) {
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null,
  );
  /** Lan dat dau tien phai dung yen, khong truot tu goc trai man hinh ra. */
  const [ready, setReady] = useState(false);

  const activeHref = nav.find((entry) => entry.active)?.href ?? null;

  useMeasureEffect(() => {
    if (!activeHref) {
      setPill(null);
      return;
    }
    const measure = () => {
      const el = linkRefs.current.get(activeHref);
      const parent = el?.offsetParent;
      if (!el || !parent) {
        return;
      }
      // CO Y khong dung offsetLeft/offsetWidth: hai tri so do LAM TRON ve so
      // nguyen, ma be ngang chu thi le (vi du 92,78px). Thanh truot hut 0,28px
      // la vien phai cua no lo ra mot soi toc so voi thiet ke — du de gate
      // pixel cua trang con nhich tu 0,003% len 0,012%.
      //
      // getBoundingClientRect() tra ve so thuc nhung DA NHAN voi ti le zoom
      // cua canvas, con `left`/`width` ta ghi ra lai la don vi canvas goc —
      // nen phai chia lai cho dung.
      const zoom =
        Number(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tc-zoom",
          ),
        ) || 1;
      const rect = el.getBoundingClientRect();
      const base = parent.getBoundingClientRect();
      setPill({
        left: (rect.left - base.left) / zoom,
        width: rect.width / zoom,
      });
    };
    measure();
    // Font tai xong thi be ngang chu doi -> phai do lai.
    document.fonts?.ready.then(measure).catch(() => undefined);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref]);

  useEffect(() => {
    if (!pill || ready) {
      return;
    }
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [pill, ready]);

  useEffect(
    () => () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    },
    [],
  );

  // Escape phai bat o cap TAI LIEU chu khong tren the <nav>. Menu mo ra bang
  // ro chuot thi tieu diem van con nam ngoai <nav>, phim bam khong bao gio
  // chay toi do.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const openNow = useCallback(
    (href: string) => {
      cancelClose();
      setOpen(submenuFor(href).length > 0 ? href : null);
    },
    [cancelClose],
  );

  return (
    <nav aria-label="Điều hướng chính">
      {pill ? (
        <span
          className="tc-navpill"
          data-ready={ready || undefined}
          aria-hidden="true"
          style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
        />
      ) : null}

      {nav.map((entry) => {
        const submenu = submenuFor(entry.href);
        const isOpen = open === entry.href;

        return (
          <div
            key={entry.href}
            className="tc-navgroup"
            style={{ display: "contents" }}
          >
            <Link
              ref={(el) => {
                if (el) {
                  linkRefs.current.set(entry.href, el);
                } else {
                  linkRefs.current.delete(entry.href);
                }
              }}
              className={entry.active ? "nv act" : "nv"}
              style={{ left: `${entry.x}px` }}
              href={entry.href}
              prefetch={false}
              aria-current={entry.active ? "page" : undefined}
              aria-expanded={submenu.length > 0 ? isOpen : undefined}
              onMouseEnter={() => openNow(entry.href)}
              onFocus={() => openNow(entry.href)}
              onMouseLeave={scheduleClose}
            >
              {entry.label}
              {/* Thiet ke: luc thuong la mui ten phai "›", luc xo xuong doi
                  thanh mui ten xuong "⌄". */}
              <i aria-hidden="true">{isOpen ? "⌄" : "›"}</i>
            </Link>

            {submenu.length > 0 ? (
              <div
                className="tc-submenu"
                data-open={isOpen || undefined}
                style={{ left: `${entry.x}px` }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                {submenu.map((child) => (
                  <Link
                    key={child.href}
                    className="tc-submenu-item"
                    href={child.href}
                    prefetch={false}
                    tabIndex={isOpen ? undefined : -1}
                    onBlur={scheduleClose}
                    onFocus={cancelClose}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
