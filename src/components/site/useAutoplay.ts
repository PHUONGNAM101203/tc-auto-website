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

  useEffect(() => {
    if (!playing) {
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const beat = setInterval(() => latest.current(), SLIDER_AUTOPLAY_MS);
    return () => clearInterval(beat);
  }, [playing]);

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
