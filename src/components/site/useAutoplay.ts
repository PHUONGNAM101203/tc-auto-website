"use client";

import { useEffect, useRef, useState } from "react";
import { MANUAL_LULL_MS, SLIDER_AUTOPLAY_MS } from "@/lib/slider-timing";

/**
 * Cho mot bang anh TU CHAY, kem day du cac cho phai dung lai.
 *
 * Ba bang tren site — bang anh, dai the Giai phap, dai the PPF — deu can y het
 * nhau, nen gom vao mot cho thay vi chep ba lan. Bang hero khong dung hook nay:
 * no co nhip rieng (3 giay) va da co san logic tai anh theo luot.
 *
 * Bang chi chay khi HOI DU ca bon dieu:
 *   - dang nam trong khung nhin (chua cuon toi thi chay la phi pin va du lieu),
 *   - chuot khong o trong bang (dang xem hoac sap bam ma anh tu doi la hong y),
 *   - vua roi nguoi dung khong bam tay (bam xong ma bi keo di ngay thi buc),
 *   - nguoi dung khong bat "giam chuyen dong" trong he dieu hanh.
 */
export interface Autoplay<T extends HTMLElement> {
  /**
   * Gan vao khoi bao ngoai de theo doi khung nhin: `ref={attach}`.
   *
   * La mot HAM chu khong phai doi tuong ref, vi React Compiler cam doc ref
   * trong luc ve. Ham nay do `useState` sinh ra nen ben ngoai on dinh.
   */
  readonly attach: (node: T | null) => void;
  /** Gan vao MOI phan tu ma chuot co the dung tren do, ke ca mui ten roi. */
  readonly hoverProps: {
    readonly onMouseEnter: () => void;
    readonly onMouseLeave: () => void;
  };
  /** Goi khi nguoi dung bam tay, de bat dau khoang lang. */
  readonly nudge: () => void;
  /** Dang thuc su chay hay khong — tien cho bai kiem va cho thuoc tinh data. */
  readonly playing: boolean;
}

export function useAutoplay<T extends HTMLElement>(
  advance: () => void,
  enabled = true,
): Autoplay<T> {
  const [node, setNode] = useState<T | null>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [nudge, setNudge] = useState(0);

  // `advance` doi sau moi lan ve lai. Giu ban moi nhat trong ref chu khong dat
  // vao danh sach phu thuoc cua interval — neu khong nhip bi dat lai moi vong
  // va bang se luot khong deu.
  const latest = useRef(advance);
  useEffect(() => {
    latest.current = advance;
  }, [advance]);

  useEffect(() => {
    if (!node) {
      return;
    }
    const watcher = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, [node]);

  // Moi lan bam lai la hen lai gio tat khoang lang; bam lien tuc thi khoang
  // lang cu duoc keo dai them.
  useEffect(() => {
    if (nudge === 0) {
      return;
    }
    const until = setTimeout(() => setNudge(0), MANUAL_LULL_MS);
    return () => clearTimeout(until);
  }, [nudge]);

  const playing = enabled && visible && !hovered && nudge === 0;

  // Nhip phai la mot CAI DONG HO CHAY DEU, khong phai mot cai hen gio dung
  // lai roi hen lai.
  //
  // Ban truoc dat `playing` vao danh sach phu thuoc, nen moi lan no doi la
  // `clearInterval` roi `setInterval` lai tu dau. Nghe thi hop ly, nhung
  // `visible` do IntersectionObserver sinh ra va no CHOP lien tuc trong luc
  // trang con xep lai — anh tai theo luot lam dai bi day len xuong qua mep
  // khung nhin. Moi lan chop la dem lai 5 giay tu dau, nen tren may cham
  // hoac mang cham dai KHONG BAO GIO doi anh. Bat duoc vi bai kiem
  // "TỰ CHẠY khi không ai đụng vào" thinh thoang rot khi chay song song —
  // do la trieu chung that cua nguoi dung chu khong phai bai kiem chap chon.
  //
  // Nay dong ho chay suot; luc dang nghi thi chi BO QUA nhip chu khong dat
  // lai. Doc `playing` qua ref de khong phai dung lai de doc gia tri moi.
  const live = useRef(playing);
  useEffect(() => {
    live.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const beat = setInterval(() => {
      if (live.current) {
        latest.current();
      }
    }, SLIDER_AUTOPLAY_MS);
    return () => clearInterval(beat);
  }, [enabled]);

  return {
    attach: setNode,
    hoverProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    nudge: () => setNudge((count) => count + 1),
    playing,
  };
}
