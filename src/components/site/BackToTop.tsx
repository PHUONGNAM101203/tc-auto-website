"use client";

import { useEffect, useState } from "react";

/**
 * Nut noi "len dau trang".
 *
 * Vi sao khong lam header dinh (sticky)? Header cua trang nam TRONG anh nen
 * canvas — tach no ra de ghim lai la lech pixel so voi ban thiet ke, ma ca du
 * an dang giu muc lech 0. Nut noi giai quyet dung nhu cau cua khach: doc den
 * cuoi trang van sang trang khac duoc ngay, khong phai cuon nguoc.
 *
 * Nut dat o goc duoi ben PHAI. Goc duoi giua da co `.toast`, ben trai de
 * trong cho thanh cong cu cua trinh duyet.
 */

/** Cuon qua quang nay moi hien nut — khoang mot man hinh ruoi. */
const SHOW_AFTER_RATIO = 1.5;

/** Khong nhuc nhich qua lau nhu the nay thi coi nhu cu cuon da chet. */
const STALL_MS = 180;
/** Bo cuoc sau quang nay, de khong quay vong vo han neu co gi do giu trang. */
const GIVE_UP_MS = 4000;

/**
 * Dua trang ve dau, va TRONG COI cho den khi ve tan noi.
 *
 * `scrollTo({behavior:"smooth"})` cua trinh duyet bi HUY giua chung neu chieu
 * cao tai lieu doi trong luc dang chay. Tren ban dien thoai dieu do xay ra
 * that: cuon nguoc len keo hang loat anh "tai theo luot cuon" vao khung nhin,
 * anh giai ma xong thi bo cuc xe dich mot chut va Chrome bo do cu cuon. Do
 * duoc: tu 1800 no dung lai o 1001.
 *
 * Nen sau khi phat lenh, ta canh theo tung khung hinh: neu vi tri dung yen ma
 * chua ve toi dau thi phat lenh lai. Nguoi dung tu cuon hoac cham tay vao thi
 * nhuong ngay — khong gianh quyen dieu khien voi ho.
 */
function glideToTop(gentle: boolean): void {
  window.scrollTo({ top: 0, behavior: gentle ? "smooth" : "auto" });
  if (!gentle) {
    return;
  }

  let last = window.scrollY;
  let stillSince = performance.now();
  const started = stillSince;
  let alive = true;

  const yield_ = () => {
    alive = false;
  };
  // `wheel`/`touchstart` la nguoi dung ra tay — dung luon.
  window.addEventListener("wheel", yield_, { once: true, passive: true });
  window.addEventListener("touchstart", yield_, { once: true, passive: true });

  const watch = () => {
    if (!alive) {
      return;
    }
    const now = performance.now();
    const y = window.scrollY;
    if (y <= 0 || now - started > GIVE_UP_MS) {
      alive = false;
      window.removeEventListener("wheel", yield_);
      window.removeEventListener("touchstart", yield_);
      return;
    }
    if (y < last - 0.5) {
      last = y;
      stillSince = now;
    } else if (now - stillSince > STALL_MS) {
      // Dung yen ma chua toi noi — cu cuon da bi huy, phat lai.
      window.scrollTo({ top: 0, behavior: "smooth" });
      stillSince = now;
    }
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
}

export function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Nguong tinh theo chieu cao khung nhin: man dai thi phai cuon nhieu hon
    // moi thay nut, dung nghia "da di kha xa khoi header".
    const check = () =>
      setShown(window.scrollY > window.innerHeight * SHOW_AFTER_RATIO);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const goTop = () => {
    glideToTop(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    // Dua luon con tro ban phim len header. Khong lam buoc nay thi nguoi dung
    // ban phim bam xong van dang "dung" o cuoi trang: nhan Tab mot cai la roi
    // tro lai cho cu, dung y nghia cua nut.
    const target = document.querySelector<HTMLElement>(
      ".hdr a.nv, .tc-m-top a, .hdr a",
    );
    target?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className="tc-totop"
      hidden={!shown}
      onClick={goTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 19V6M6 12l6-6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
