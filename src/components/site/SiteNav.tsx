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
  /**
   * Co ve thanh truot danh dau muc dang xem khong.
   *
   * TRANG CHINH: co. Header o do dung tu prototype, nen sau khi ta bo nen cua
   * `.nv.act` thi thanh truot la thu duy nhat danh dau.
   *
   * TRANG CON: KHONG. Header o do nam trong anh PNG thiet ke va o danh dau da
   * duoc VE CHET vao anh roi — ve them thanh truot la ra HAI khung long nhau.
   */
  readonly pill?: boolean;
}

/** Khoang tre truoc khi dong menu — de con tro kip di tu nhan xuong bang. */
const CLOSE_DELAY_MS = 180;

/**
 * Cho nho vi tri thanh truot GIUA HAI LAN CHUYEN TRANG.
 *
 * Doi tab la ca cay component dung lai tu dau — the `.tc-navpill` cu bi vut di,
 * the moi sinh ra o vi tri moi. Hieu ung CSS chi chay khi mot the DOI gia tri,
 * the vua sinh ra thi khong co gi de doi, nen nguoi dung thay no "tat roi hien
 * lai cho khac" chu khong thay no truot.
 *
 * Chua vi tri cu o `sessionStorage` thi the moi biet minh phai xuat phat tu
 * dau: dat o cho CU truoc (khong hieu ung), roi khung hinh sau moi doi sang
 * cho MOI (co hieu ung) — luc do moi thanh mot cu truot that.
 *
 * Dung sessionStorage chu khong dung bien module: tai lai trang that (bam
 * giua chuot, go dia chi) thi bien module cung mat.
 */
const PILL_MEMORY_KEY = "tc-navpill";

interface PillBox {
  readonly left: number;
  readonly width: number;
}

function rememberPill(box: PillBox | null): void {
  try {
    if (box) {
      sessionStorage.setItem(PILL_MEMORY_KEY, JSON.stringify(box));
    } else {
      // Trang chu khong sang muc nao. Xoa di, neu khong thi tu trang chu bam
      // sang trang khac se thay thanh truot bay ra tu mot cho vo nghia.
      sessionStorage.removeItem(PILL_MEMORY_KEY);
    }
  } catch {
    // Trinh duyet chan storage (che do rieng tu chang han) — bo hieu ung,
    // khong de no lam hong dieu huong.
  }
}

function recallPill(): PillBox | null {
  try {
    const raw = sessionStorage.getItem(PILL_MEMORY_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PillBox>;
    return typeof parsed.left === "number" && typeof parsed.width === "number"
      ? { left: parsed.left, width: parsed.width }
      : null;
  } catch {
    return null;
  }
}

/**
 * `useLayoutEffect` canh bao khi chay o phia may chu. Component nay co "use
 * client" nhung Next VAN dung san HTML cua no tren may chu, nen phai doi sang
 * `useEffect` o do. Do dung phep do truoc khi trinh duyet ve, neu dung
 * `useEffect` thi nguoi dung kip thay thanh truot nhay mot cai.
 */
const useMeasureEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SiteNav({ nav, pill: showPill = true }: SiteNavProps) {
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState<string | null>(null);
  /**
   * Muc dang duoc ro chuot. Thanh truot BAM THEO con tro; roi ra khoi thanh
   * dieu huong thi no truot ve muc dang xem.
   */
  const [hovered, setHovered] = useState<string | null>(null);
  const [pill, setPill] = useState<PillBox | null>(null);
  /** Bat hieu ung truot. Lan dat DAU TIEN phai tat, khong thi no bay tu goc
      trai man hinh ra. */
  const [ready, setReady] = useState(false);
  const activeHref = nav.find((entry) => entry.active)?.href ?? null;
  /** Cho thanh truot phai toi: dang ro chuot vao dau thi toi do. */
  const pillHref = showPill ? (hovered ?? activeHref) : null;
  /** Vi tri hien tai, de ghi lai LUC ROI TRANG. */
  const current = useRef<PillBox | null>(null);
  /** Da qua lan dat dau tien cua LAN MOUNT nay chua. */
  const placed = useRef(false);

  useMeasureEffect(() => {
    if (!pillHref) {
      setPill(null);
      current.current = null;
      rememberPill(null);
      return;
    }

    // Doc cho cu NGAY LUC MOUNT, truoc moi phep do. Gia tri nay do lan roi
    // trang truoc ghi lai, va no KHONG bi ghi de trong suot thoi gian o trang
    // nay — nho vay component co mount hai lan (Next hay lam vay khi doi
    // trang) thi ca hai lan deu doc ra cung mot diem xuat phat va cung truot
    // nhu nhau. Ghi luc mount thi lan mount thu hai doc phai chinh gia tri
    // vua ghi, va cu truot bien mat — da dinh dung bay do mot lan.
    const from = placed.current ? null : recallPill();
    let first = !placed.current;
    /**
     * Dang chay cu truot thi KHONG cho phep do lai ghi de vi tri.
     *
     * `document.fonts.ready` thuong xong NGAY lap tuc vi font da nam trong bo
     * nho dem, nen `measure()` chay lan hai truoc khi cu truot kip bat dau va
     * nem thanh truot thang toi dich — mat hieu ung. Lan chuyen tab DAU TIEN
     * sau khi tai trang thi thoat, vi luc do font chua san sang; day la ly do
     * loi chi lo ra tu lan chuyen thu hai tro di.
     */
    let gliding = false;

    const measure = () => {
      const el = linkRefs.current.get(pillHref);
      const parent = el?.offsetParent;
      if (!el || !parent) {
        return;
      }
      // CO Y khong dung offsetLeft/offsetWidth: hai tri so do LAM TRON ve so
      // nguyen, ma be ngang chu thi le (vi du 92,78px). Thanh truot hut 0,28px
      // la vien phai cua no lo ra mot soi toc so voi thiet ke.
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
      const target: PillBox = {
        left: (rect.left - base.left) / zoom,
        width: rect.width / zoom,
      };
      current.current = target;

      const wasFirst = first;
      first = false;
      placed.current = true;

      // Lan do sau (font tai xong, doi be rong cua so): chi cap nhat dich —
      // tru khi cu truot dang chay do, luc do de yen cho no chay het.
      if (!wasFirst) {
        if (!gliding) {
          setPill(target);
        }
        return;
      }

      if (!from || Math.abs(from.left - target.left) < 1) {
        // Vao thang trang nay lan dau, hoac van dung muc cu — dat thang,
        // khong ve mot cu truot khong co that.
        setPill(target);
        setReady(true);
        return;
      }

      // Vua doi tab: xuat phat tu cho CU roi truot sang cho moi.
      //
      // BA NHIP, khong duoc gop:
      //   1. dat o cho CU, hieu ung TAT   -> trinh duyet ve xong o cho cu
      //   2. BAT hieu ung, gia tri KHONG doi -> transition duoc "vu trang"
      //   3. doi sang cho MOI             -> luc nay moi co cai de truot
      //
      // Gop nhip 2 va 3 lam mot la hong: trinh duyet chi chay transition khi
      // thuoc tinh do DA CO SAN truoc luc gia tri doi. Them `transition` cung
      // luc voi gia tri moi thi no nhay thang toi noi. Day chinh la cho da lam
      // thanh truot "tat roi hien lai" thay vi truot.
      gliding = true;
      setPill(from);
      setReady(false);
      requestAnimationFrame(() => {
        setReady(true);
        requestAnimationFrame(() => {
          // Lay dich MOI NHAT: font co the da tai xong giua chung va doi be
          // ngang chu.
          setPill(current.current ?? target);
          gliding = false;
        });
      });
    };

    measure();
    // Font tai xong thi be ngang chu doi -> phai do lai.
    document.fonts?.ready.then(measure).catch(() => undefined);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      // GHI LUC ROI TRANG, khong ghi luc vao trang — xem chu thich tren.
      rememberPill(current.current);
    };
  }, [pillHref]);

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

  /**
   * Dong menu VA tha thanh truot ve muc dang xem.
   *
   * Dung chung mot bo dem tre voi menu, khong tach ra: di tu nhan nay sang
   * nhan ben canh thi `mouseleave` cua nhan cu chay TRUOC `mouseenter` cua
   * nhan moi. Tha ngay la thanh truot giat ve muc dang xem roi moi quay lai —
   * nhap nhay. Cho 180ms thi `mouseenter` kip huy cu tha do.
   */
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpen(null);
      setHovered(null);
    }, CLOSE_DELAY_MS);
  }, [cancelClose]);

  const openNow = useCallback(
    (href: string) => {
      cancelClose();
      setHovered(href);
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
              onClick={() => {
                // Bam la chot: tha con tro ra de thanh truot dung lai o tab
                // moi thay vi con bam theo chuot.
                cancelClose();
                setHovered(null);
                setOpen(null);
              }}
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
