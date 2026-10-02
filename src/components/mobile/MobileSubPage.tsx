import { MobileFooter } from "@/components/mobile/MobileFooter";
import Link from "next/link";
import { MobileNav } from "@/components/mobile/MobileNav";
import { MobileStrip } from "@/components/mobile/MobileStrip";
import {
  MobileTabs,
  type MobileTabGroup,
} from "@/components/mobile/MobileTabs";
import { headingAlreadyShown } from "@/lib/mobile-heading";
import { mergeByY } from "@/lib/mobile-order";
import { MobileTree } from "@/components/mobile/MobileTree";
import { buildTree } from "@/lib/mobile-tree";
import type { MobileBlock as MobileStripBlock } from "@/lib/mobile-blocks";
import { getMobileHero, type MobileBlock } from "@/lib/mobile-subpage";
import type { SubPageSpec } from "@/lib/subpage-schema";
import type { PpfCard } from "@/lib/ppf-cards";
import type { Product } from "@/lib/products";
import type { NavSpec } from "@/lib/types";

/**
 * Ban MOBILE cua 31 trang con.
 *
 * Trang con von la ANH: chu nam trong anh nen thu xuong be rong dien thoai la
 * khong doc noi. O day chu duoc lay tu ban OCR da trich va ve lai bang chu
 * THAT — doc duoc, chon duoc, may tim kiem doc duoc. Anh dau trang giu lai de
 * khong mat khong khi cua thiet ke.
 */
export function MobileSubPage({
  page,
  nav,
  blocks,
  strips = [],
  feature,
  childPages,
  links = [],
  products = [],
  screenTabs,
  cards = [],
  contact,
}: {
  page: SubPageSpec;
  nav: readonly NavSpec[];
  blocks: readonly MobileBlock[];
  /**
   * Cac DAI anh cua trang (bang "BỘ SƯU TẬP", dai "CÁC BÀI VIẾT KHÁC").
   *
   * Tren desktop chung la bang chuyen co chieu sau dung toa do canvas 1440px,
   * nen duoi 900px thi mat han. Xem src/lib/mobile-subpage-strips.ts.
   */
  strips?: readonly MobileStripBlock[];
  /**
   * Khoi tuong tac cua rieng trang nay (trac nghiem, o tim dai ly).
   *
   * Ban desktop dat chung tuyet doi len dung cho ve san trong anh nen; o day
   * la CUNG component do nhung xep doc — xem thuoc tinh `layout`.
   */
  feature?: React.ReactNode;
  childPages: readonly SubPageSpec[];
  /** Lien ket trong long trang — xem src/lib/mobile-links.ts. */
  links?: readonly { href: string; label: string; external: boolean }[];
  /**
   * San pham cua trang danh muc nay.
   *
   * Ban desktop hien chung thanh cac the tren canvas; ban mobile khong co
   * canvas nen phai xep lai thanh luoi doc — neu khong thi tren dien thoai
   * trang danh muc chang co san pham nao.
   */
  products?: readonly Product[];
  /**
   * Bo TAB cua trang (WINCA/BRAVO, hoac 5DO/3M/NANO SUN).
   *
   * Co no thi khoi san pham phang o duoi KHONG ve nua — neu khong thi cung
   * mot danh sach hien hai lan.
   */
  screenTabs?: {
    readonly label: string;
    readonly initial?: string;
    readonly groups: readonly MobileTabGroup[];
  };
  /**
   * Dai the 3M PPF. Ban desktop cho no truot ngang bang mui ten ve san trong
   * thiet ke; ban mobile khong co dai do nen phai xep lai, neu khong bon the
   * nay bien mat khoi dien thoai.
   */
  cards?: readonly PpfCard[];
  contact?: React.ReactNode;
}) {
  // Lat nen dau tien co ca tua de VE SAN trong anh. Ban mobile ve lai tua de
  // bang chu that, nen dung ban cat da bo cot do — neu khong tua de hien hai
  // lan, chong len nhau.
  const hero = getMobileHero(page.slug) ?? page.slices[0]?.src ?? null;

  // Dung lai tu `childPages` chu khong goi buildTree(page.slug): ban desktop
  // ve danh sach tu DUNG prop nay, hai ban phai liet ke y het nhau.
  // Tieu de ma bai viet DA in ra roi — "CÁC BÀI VIẾT KHÁC" la mot the h2
  // trong chinh mach chu, nen dai cung ten thi khong in nhan nua.
  const shownHeadings = blocks
    .filter((block) => block.kind === "heading")
    .map((block) => block.text);

  const tree = childPages.map((child) => ({
    href: child.route,
    label: child.title,
    children: buildTree(child.slug, 2),
  }));

  return (
    <div className="tc-m">
      <MobileNav nav={nav} />

      <section className="tc-m-hero tc-m-hero-sub">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element -- lat nen cat san
          <img src={hero} alt="" width={1440} height={1080} fetchPriority="high" />
        ) : null}
        <div className="tc-m-hero-text">
          {/* `p` chu khong phai `h1`: lop chu an `.tc-sr` phia duoi da co mot
              `h1` cho chinh trang nay, ma hai the h1 trung noi dung tren cung
              mot trang la mot loi chuan hoa — ca hai deu nam trong DOM du chi
              mot cai hien ra. Kieu chu khong doi. */}
          <p className="tc-m-hero-title">{page.title}</p>
        </div>
      </section>

      {/* Dai anh duoc TRON vao giua cac doan chu theo do cao tren canvas, chu
          khong day xuong cuoi: bang "BỘ SƯU TẬP" nam o y 1761 trong mot trang
          cao 2644, day xuong cuoi la doc sai mach cua ban desktop. */}
      <article className="tc-m-article">
        {mergeByY(
          blocks.map((block, index) => ({
            y: block.y,
            item: renderText(block, index),
          })),
          strips.map((strip) => ({
            y: strip.y,
            item: (
              <MobileStrip
                key={strip.id}
                block={strip}
                showLabel={!headingAlreadyShown(strip.label, shownHeadings)}
              />
            ),
          })),
        )}
      </article>

      {cards.length > 0 ? (
        <section className="tc-m-sec" aria-label="Các dòng 3M PPF">
          <ul className="tc-m-prods">
            {cards.map((card) => (
              <li key={card.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                <img src={card.art} alt="" loading="lazy" decoding="async" />
                <strong>{card.title}</strong>
                {card.body ? <em>{card.body}</em> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {screenTabs ? (
        <MobileTabs
          groups={screenTabs.groups}
          label={screenTabs.label}
          initial={screenTabs.initial}
        />
      ) : null}

      {!screenTabs && products.length > 0 ? (
        <section className="tc-m-sec" aria-label="Sản phẩm">
          <ul className="tc-m-prods">
            {products.map((product) => (
              <li key={product.slug}>
                <Link href={product.route} prefetch={false}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san */}
                  <img
                    src={product.mobileImage ?? product.image}
                    srcSet={
                      product.mobileImage
                        ? `${product.mobileImage} 360w, ${product.image} ${product.imageWidth}w`
                        : undefined
                    }
                    /* Danh sach mot cot: anh chiem het be ngang tru le. */
                    sizes={product.mobileImage ? "calc(100vw - 40px)" : undefined}
                    alt=""
                    width={product.imageWidth}
                    height={product.imageHeight}
                    loading="lazy"
                    decoding="async"
                  />
                  <strong>{product.name}</strong>
                  <em>{product.description}</em>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Loi vao danh muc co bo loc.
          Lop `tc-m-cta` phai nam tren CHINH the <a>: dat o the boc ngoai thi
          cai duoc to nhu mot cai nut la the <p>, con vung bam that chi cao
          15px. */}
      {page.slug === "giai-phap/man-hinh" ? (
        <Link
          className="tc-m-cta"
          href="/giai-phap/man-hinh/tat-ca"
          prefetch={false}
        >
          Xem tất cả các mẫu
        </Link>
      ) : null}

      {/* Moi lien ket trong long trang — tren desktop chung la vung bam trong
          suot dat theo toa do canvas, ma canvas thi bi an duoi 900px. Khong co
          khoi nay thi tren dien thoai trang "Kho ứng dụng" co 15 tep tai ma
          khong bam duoc cai nao. Xem src/lib/mobile-links.ts. */}
      {feature}

      {links.length > 0 ? (
        <nav className="tc-m-links" aria-label="Liên kết trong trang">
          <h2>Trong trang này</h2>
          {links.map((link) =>
            link.external ? (
              <a
                key={`${link.href}-${link.label}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                prefetch={false}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      ) : null}

      {/* Danh sach PHANG truoc day giau mat cap thu ba: dung o "Ứng dụng" thi
          khong the biet duoi no con "Kho ứng dụng" va "Cập nhật và lỗi". Nay
          hang nao con trang con thi co mui ten rieng, bam vao mo ngay tai cho. */}
      {tree.length > 0 ? (
        <nav className="tc-m-children" aria-label="Nội dung trong mục này">
          <h2>Xem thêm trong mục này</h2>
          <MobileTree nodes={tree} />
        </nav>
      ) : null}

      {contact ? (
        <section className="tc-m-contact">
          <h2 className="tc-m-contact-head">TC LUÔN SẴN SÀNG ĐỒNG HÀNH CÙNG BẠN</h2>
          {contact}
        </section>
      ) : null}
      <MobileFooter nav={nav} />
    </div>
  );
}

/** Mot khoi chu cua bai: tieu de, doan van, hoac mot tam anh cat san. */
function renderText(block: MobileBlock, index: number) {
  const key = `${index}-${block.image ?? block.text.slice(0, 14)}`;
  if (block.kind === "figure") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- anh cat san
      <img key={key} className="tc-m-shot" src={block.image} alt="" loading="lazy" />
    );
  }
  return block.kind === "heading" ? (
    <h2 key={key}>{block.text}</h2>
  ) : (
    <p key={key}>{block.text}</p>
  );
}
