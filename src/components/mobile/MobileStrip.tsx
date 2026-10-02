import Link from "next/link";
import { MobileCarousel } from "@/components/mobile/MobileCarousel";
import { SLIDER_AUTOPLAY_MS } from "@/lib/slider-timing";
import type { MobileBlock } from "@/lib/mobile-blocks";

/**
 * Mot DAI cua ban desktop, dung lai cho dien thoai.
 *
 * Dung o ca `MobilePage` (6 trang chinh) lan `MobileSubPage` (31 trang con),
 * nen tach rieng ra day thay vi chep hai lan — dai "BỘ SƯU TẬP" tren trang
 * Khoảnh khắc va dai "CÁC DỰ ÁN" tren trang Giải pháp giong het nhau ve cach
 * dung, chi khac cho dat.
 *
 * Ban desktop ve chung co CHIEU SAU (cac tam nghieng dan ra hai ben, bam vao
 * tam nao thi tam do chay vao giua). Phep nghieng do dua tren toa do canvas
 * 1440px nen khong mang xuong dien thoai duoc — o day la dai cuon ngang that,
 * co `scroll-snap`, tu chay va cham la dung.
 */
export function MobileStrip({
  block,
  showLabel = true,
}: {
  readonly block: MobileBlock;
  /**
   * In nhan cua dai ra hay khong.
   *
   * Co dai da co san tieu de trong mach chu cua trang ("CÁC DỰ ÁN ĐÃ TRIỂN
   * KHAI" la mot muc chu tren trang Giai phap, "CÁC BÀI VIẾT KHÁC" la mot the
   * h2 trong bai viet). In them thi nguoi doc thay hai lan, chi khac moi chu
   * hoa chu thuong. Ten cho trinh doc man hinh thi VAN giu —
   * `MobileCarousel` nhan no qua `label`.
   */
  readonly showLabel?: boolean;
}) {
  if (block.kind === "carousel") {
    return (
      <section className="tc-m-sec">
        {showLabel ? <p className="tc-m-label">{block.label}</p> : null}
        <MobileCarousel
          slides={block.slides}
          label={block.label}
          everyMs={SLIDER_AUTOPLAY_MS}
          ratio={block.ratio}
        />
      </section>
    );
  }

  return (
    <section className="tc-m-sec">
      {showLabel && block.label ? (
        <p className="tc-m-label">{block.label}</p>
      ) : null}
      <ul className="tc-m-tiles" style={{ ["--tc-m-tile" as string]: block.ratio }}>
        {block.tiles.map((tile) => (
          <li key={tile.href + tile.title}>
            {/* `aria-label` luon co: chu cua the nam trong anh nen neu khong
                khai thi day la mot lien ket KHONG CO TEN. */}
            <Link href={tile.href} prefetch={false} aria-label={tile.label || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
              <img
                src={tile.mobileSrc ?? tile.src}
                srcSet={
                  tile.mobileSrc ? `${tile.mobileSrc} 360w, ${tile.src} 750w` : undefined
                }
                /* Luoi hai cot: moi o chiem nua be ngang, tru le va khe giua. */
                sizes={tile.mobileSrc ? "calc((100vw - 52px) / 2)" : undefined}
                alt=""
                loading="lazy"
                decoding="async"
              />
              {tile.title ? <strong>{tile.title}</strong> : null}
              {tile.subtitle ? <em>{tile.subtitle}</em> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
