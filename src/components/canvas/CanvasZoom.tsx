"use client";

import { useEffect } from "react";

/**
 * Giu --tc-zoom luon dung ti le = be rong kha dung / 1440.
 *
 * Inline script trong SiteLayout chi chay o lan tai tai lieu dau tien. Khi nguoi
 * dung di tu mot trang NGOAI nhom (site) — vi du trang 404 hay /admin — roi bam
 * link ve trang chu, Next dieu huong phia client: React chen lai the <script>
 * nhung script chen bang innerHTML KHONG BAO GIO chay. Khi do --tc-zoom giu
 * nguyen gia tri cu (hoac chua he duoc dat, roi ve mac dinh 1) va canvas 1440px
 * nam lot thom giua man hinh rong.
 *
 * Component nay dong bo lai ngay khi mount nen moi duong vao deu dung.
 *
 * Dung ResizeObserver chu khong chi nghe `resize`: trinh duyet khong ban su kien
 * `resize` khi thanh cuoc doc xuat hien hay bien mat, ma luc do clientWidth da
 * doi ~15px — du de anh nen lech net.
 */
export function CanvasZoom() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const scale = Math.max(root.clientWidth, 320) / 1440;
      root.style.setProperty("--tc-zoom", String(scale));
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(root);
    window.addEventListener("orientationchange", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return null;
}
