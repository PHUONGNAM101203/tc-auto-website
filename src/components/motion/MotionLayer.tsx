"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Do lech giua cac phan tu vao khung nhin cung luc (ms). */
const STAGGER_MS = 70;
const STAGGER_MAX_MS = 350;
/** Kich hoat khi phan tu vao sau 12% chieu cao khung nhin. */
const ROOT_MARGIN = "0px 0px -12% 0px";
/** Coi la "da toi day trang" khi con cach duoi duoi nguong nay (px). */
const BOTTOM_EPSILON = 4;

/**
 * Chi quan sat cac phan tu KHONG bi clip-path:
 *  - [data-rv]        : an bang opacity/transform, tu reveal chinh no
 *  - [data-reveal-group]: khoi cha khong bi clip, reveal cac .sl / .hero-line ben trong
 *
 * Tai sao: Chrome ap clip-path cua chinh element vao rect giao cua
 * IntersectionObserver. Phan tu dang `clip-path: inset(0 0 100% 0)` co rect giao
 * rong tuyet doi nen KHONG BAO GIO duoc bao la intersecting — quan sat truc tiep
 * no se lam noi dung vo hinh mai mai.
 */
const REVEAL_SELECTOR = "[data-rv]:not([data-revealed]), [data-reveal-group]:not([data-revealed])";
/**
 * Khoi boc lat nen con chua duoc tai.
 *
 * PHAI quan sat KHOI BOC chu khong phai the <img> ben trong: khoi boc dat
 * `content-visibility: auto`, nen khi no nam ngoai khung nhin thi con cua no
 * KHONG co hop bo cuc — IntersectionObserver se khong bao gio bao <img> la
 * intersecting va anh se khong bao gio duoc tai.
 */
const LAZY_SELECTOR = "[data-reveal-group]:has(img[data-src])";
/** Bat dau tai anh khi con cach khung nhin khoang nay — du som de khong thay o trong. */
const PRELOAD_MARGIN = "600px 0px 600px 0px";
/** Phan tu con duoc bat hieu ung khi khoi cha vao khung nhin. */
const GROUP_CHILD_SELECTOR = ".sl, .hero-line";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Dieu phoi toan bo hieu ung: reveal khi cuon, thanh tien do, con tro vong tron,
 * man cho tai trang va man chuyen trang.
 *
 * Moi hieu ung ket thuc o dung trang thai thiet ke Figma (opacity 1, transform
 * none, clip-path day du) nen khong lam sai lech giao dien.
 */
export function MotionLayer() {
  const pathname = usePathname();

  // --- 1. Reveal khi cuon toi (chay lai moi khi doi trang) ---
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    if (targets.length === 0) {
      return;
    }

    const animated = new Set<HTMLElement>();

    if (prefersReducedMotion()) {
      for (const el of document.querySelectorAll<HTMLElement>(".rv, .sl, .hero-line")) {
        el.classList.add("is-in", "is-settled");
      }
      for (const el of targets) {
        el.setAttribute("data-revealed", "");
      }
      return;
    }

    /** Sau khi animation xong: bo will-change / transition de giai phong layer GPU. */
    const settle = (event: TransitionEvent) => {
      if (event.propertyName !== "transform" && event.propertyName !== "clip-path") {
        return;
      }
      const el = event.currentTarget as HTMLElement;
      el.classList.add("is-settled");
      el.removeEventListener("transitionend", settle);
      animated.delete(el);
    };

    const reveal = (el: HTMLElement) => {
      animated.add(el);
      el.classList.add("is-in");
      el.addEventListener("transitionend", settle);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        arriving.forEach((entry, index) => {
          const el = entry.target as HTMLElement;
          el.setAttribute("data-revealed", "");
          observer.unobserve(el);

          if (el.hasAttribute("data-reveal-group")) {
            // .hero-line tu giu do lech theo dong (style inline) nen khong ghi de.
            for (const child of el.querySelectorAll<HTMLElement>(GROUP_CHILD_SELECTOR)) {
              reveal(child);
            }
            return;
          }

          el.style.setProperty(
            "--rv-delay",
            `${Math.min(index * STAGGER_MS, STAGGER_MAX_MS)}ms`,
          );
          reveal(el);
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    for (const el of targets) {
      observer.observe(el);
    }

    /**
     * Luoi an toan cho phan duoi cung cua trang.
     * ROOT_MARGIN am o day nghia la dai 12% chieu cao khung nhin duoi cung KHONG
     * bao gio nam trong vung trigger. Phan tu nao thap hon (vi du lat nen cuoi
     * chi cao 77px) se vinh vien khong duoc reveal. Khi nguoi dung cuon het
     * trang, reveal thang toan bo phan con lai.
     */
    const flushBottom = () => {
      const doc = document.documentElement;
      if (doc.scrollTop + doc.clientHeight < doc.scrollHeight - BOTTOM_EPSILON) {
        return;
      }
      for (const el of document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)) {
        el.setAttribute("data-revealed", "");
        observer.unobserve(el);
        if (el.hasAttribute("data-reveal-group")) {
          for (const child of el.querySelectorAll<HTMLElement>(GROUP_CHILD_SELECTOR)) {
            reveal(child);
          }
        } else {
          reveal(el);
        }
      }
    };

    window.addEventListener("scroll", flushBottom, { passive: true });
    window.addEventListener("resize", flushBottom, { passive: true });
    flushBottom();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", flushBottom);
      window.removeEventListener("resize", flushBottom);
      for (const el of animated) {
        el.removeEventListener("transitionend", settle);
      }
      animated.clear();
    };
  }, [pathname]);

  // --- 1b. Tai anh nen theo kieu "cuon toi dau tai toi do" ---
  useEffect(() => {
    const pending = Array.from(document.querySelectorAll<HTMLElement>(LAZY_SELECTOR));
    if (pending.length === 0) {
      return;
    }

    const load = (group: Element) => {
      const image = group.querySelector<HTMLImageElement>("img[data-src]");
      if (!image) {
        return;
      }
      const { src, srcset } = image.dataset;
      if (!src) {
        return;
      }
      // Phai chuyen sang "eager" TRUOC khi gan nguon.
      // Khoi boc dat `content-visibility: auto` nen khi nam ngoai khung nhin no
      // khong co hop bo cuc; de nguyen loading="lazy" thi trinh duyet hoan tai
      // VO HAN va anh khong bao gio hien. Toi day ta da biet no sap vao khung
      // nhin roi, nen tai ngay la dung.
      image.loading = "eager";
      // Gan srcset TRUOC src: neu gan src truoc, trinh duyet co the tai ban sai
      // ti le roi mo it lau sau moi doi sang ban dung.
      if (srcset) {
        image.srcset = srcset;
      }
      image.src = src;
      delete image.dataset.src;
      delete image.dataset.srcset;
    };

    // Nguong rong hon lop reveal: anh phai ve KIP truoc khi phan tu hien ra.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            load(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: PRELOAD_MARGIN, threshold: 0 },
    );

    for (const group of pending) {
      observer.observe(group);
    }

    // Luoi an toan: toi day trang thi tai not phan con lai.
    const flush = () => {
      const doc = document.documentElement;
      if (doc.scrollTop + doc.clientHeight < doc.scrollHeight - 4) {
        return;
      }
      for (const group of document.querySelectorAll<HTMLElement>(LAZY_SELECTOR)) {
        load(group);
        observer.unobserve(group);
      }
    };
    window.addEventListener("scroll", flush, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", flush);
    };
  }, [pathname]);

  // --- 2. Thanh tien do cuon ---
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const bar = document.querySelector<HTMLElement>(".tc-progress");
    if (!bar) {
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? Math.min(1, doc.scrollTop / scrollable) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  // --- 3. Con tro vong tron (chi thiet bi co chuot that) ---
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const ring = document.querySelector<HTMLElement>(".tc-cursor");
    if (!ring) {
      return;
    }

    const HOT = "a, button, input, textarea, [data-magnetic], .nv, .search";
    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      ring.classList.add("is-on");
      ring.classList.toggle(
        "is-hot",
        Boolean((event.target as Element | null)?.closest?.(HOT)),
      );
      if (frame === 0) {
        frame = requestAnimationFrame(paint);
      }
    };
    const onLeave = () => ring.classList.remove("is-on");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  // --- 4. An man cho tai sau khi anh dau tien san sang ---
  useEffect(() => {
    const boot = document.querySelector<HTMLElement>(".tc-boot");
    if (!boot) {
      return;
    }
    const done = () => boot.setAttribute("data-done", "true");

    if (document.readyState === "complete") {
      done();
      return;
    }
    window.addEventListener("load", done, { once: true });
    // Chan tren: khong bao gio giu man cho qua 2.2s du anh cham.
    const timer = setTimeout(done, 2200);
    return () => {
      window.removeEventListener("load", done);
      clearTimeout(timer);
    };
  }, []);

  // --- 5. Man chuyen trang: queo len khi trang moi vao ---
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const curtain = document.querySelector<HTMLElement>(".tc-curtain");
    if (!curtain) {
      return;
    }
    curtain.setAttribute("data-state", "reveal");
    const timer = setTimeout(() => curtain.removeAttribute("data-state"), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  // --- 6. Cuon toi phan tu duoc tro tu ket qua tim kiem (#item-id) ---
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }
    // Cho canvas ap dung zoom xong roi moi tinh vi tri cuon.
    const timer = setTimeout(() => {
      const behavior = prefersReducedMotion() ? "auto" : "smooth";

      // Neo dang "#y1234": toa do y trong canvas 1440px (dung cho trang con
      // la anh — khong co phan tu DOM de nhay toi).
      const byCoord = /^y(\d+)$/.exec(hash);
      if (byCoord) {
        const zoom = Number(
          getComputedStyle(document.documentElement).getPropertyValue("--tc-zoom") || 1,
        );
        const top = Number(byCoord[1]) * (Number.isFinite(zoom) && zoom > 0 ? zoom : 1) - 140;
        window.scrollTo({ top: Math.max(0, top), behavior });
        return;
      }

      const target = document.getElementById(hash);
      if (!target) {
        return;
      }
      const top = target.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: Math.max(0, top), behavior });
      target.classList.add("is-in", "is-settled");
    }, 240);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
