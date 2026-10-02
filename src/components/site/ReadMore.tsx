"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import {
  hasSomethingToShow,
  readMorePanel,
  toParagraphs,
  type CtaSpot,
} from "@/lib/cta-links";

/**
 * Nut "XEM THÊM" ve san trong anh trang con.
 *
 * Thiet ke lam MO DAN cuoi khoi chu — nhung chu van duoc ve that trong anh nen
 * OCR doc duoc het. Bam "XEM THÊM" thi khoi chu XO DAI RA NGAY TAI CHO, de len
 * phan ben duoi. Khong mo lop phu, khong mo bang: nguoi dung da noi ro.
 *
 * Nut nao co trang chi tiet that (vi du tin tuyen dung) thi dan thang toi do.
 */
function key(spot: CtaSpot) {
  return `${spot.x}-${spot.y}`;
}

function Expanded({ spot, onClose }: { spot: CtaSpot; onClose: () => void }) {
  const box = spot.bodyBox;
  if (!box) {
    return null;
  }

  // Ban thiet ke da noi ro cho nao xuong doan qua khoang cach giua cac dong;
  // chi doan theo do dai cau khi thieu du lieu do.
  const paragraphs = box.paragraphs.length > 0 ? box.paragraphs : toParagraphs(spot.body);
  // Khung phai bao ca khoi chu LAN nut do ve san — xem readMorePanel.
  const panel = readMorePanel(spot)!;

  return (
    <div
      className="tc-readmore-panel"
      data-dark-text={spot.darkText || undefined}
      style={{
        left: panel.left,
        top: panel.top,
        width: panel.width,
        minHeight: panel.minHeight,
        background: spot.background ?? "var(--navy)",
        // Co chu / khoang dong lay dung tu ban thiet ke: phan xo ra phai noi
        // tiep lien mach voi phan dang hien, khong duoc doi kieu chu.
        fontSize: `${box.fontSize}px`,
        lineHeight: `${box.lineHeight}px`,
        ["--readmore-gap" as string]: `${box.paragraphGap}px`,
      }}
    >
      {spot.isPlaceholder ? (
        <p className="tc-readmore-note">
          Bản thiết kế đang để tiêu đề mẫu “TÊN BÀI VIẾT” cho ô này — cần đặt tiêu đề thật.
        </p>
      ) : null}

      {paragraphs.length > 0 ? (
        paragraphs.map((text, index) => <p key={`${index}-${text.slice(0, 16)}`}>{text}</p>)
      ) : (
        <p>Nội dung của bài này chưa có trong bộ thiết kế.</p>
      )}

      <button type="button" className="tc-readmore-less" onClick={onClose}>
        Thu gọn
      </button>
    </div>
  );
}

export function ReadMore({
  spots,
  posts = [],
}: {
  spots: readonly CtaSpot[];
  /**
   * Bai viet THAT cua muc nay. Thiet ke de san nhung o tieu de mau
   * "TÊN BÀI VIẾT"; co bai nao thi o tuong ung dan thang sang bai do.
   */
  posts?: readonly { slug: string; title: string }[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (spots.length === 0) {
    return null;
  }

  // Gan bai viet vao cac o dat cho, theo dung thu tu xuat hien tren trang.
  const placeholders = spots.filter((spot) => spot.isPlaceholder);
  const postFor = new Map(
    placeholders.slice(0, posts.length).map((spot, index) => [key(spot), posts[index]]),
  );

  return (
    <>
      {spots.map((spot) => {
        const post = postFor.get(key(spot));
        // Khong co bai, khong co dich den, khong doc duoc khoi chu nao: dung
        // dat vung bam len. Xem hasSomethingToShow.
        if (!post && !hasSomethingToShow(spot)) {
          return null;
        }
        const isOpen = openKey === key(spot);
        return (
          <Fragment key={key(spot)}>
            {post ? (
              <Link
                href={`/bai-viet/${post.slug}`}
                prefetch={false}
                className="tc-readmore"
                style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
                aria-label={`Đọc bài: ${post.title}`}
              >
                {spot.darkText ? <Label /> : null}
              </Link>
            ) : spot.href ? (
              <Link
                href={spot.href}
                prefetch={false}
                className="tc-readmore"
                style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
                aria-label={`Xem chi tiết: ${spot.heading || "bài viết"}`}
              >
                {spot.darkText ? <Label /> : null}
              </Link>
            ) : (
              <button
                type="button"
                className="tc-readmore"
                data-open={isOpen || undefined}
                style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
                onClick={() => setOpenKey(isOpen ? null : key(spot))}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Thu gọn" : "Xem thêm"}: ${spot.heading || "bài viết"}`}
              >
                {spot.darkText ? <Label open={isOpen} /> : null}
              </button>
            )}

            {isOpen && !post ? <Expanded spot={spot} onClose={() => setOpenKey(null)} /> : null}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * Nhan "XEM THÊM" ve bang PHAN TU THAT, de len cai ve san trong anh.
 *
 * CHI ve o nhung o co `darkText` — tuc la o nam tren DAI NEN TRANG cua thiet
 * ke. Bon dai do nay da duoc to thanh navy cho dong bo voi ca site, va cho
 * nao thiet ke lam MO DAN phan chu thua thi nhan "XEM THÊM" nam ngay trong
 * vung mo, gan nhu khong doc duoc. Khach chi ra hai cho (02/10/2026):
 * /giai-phap/du-an va /nhan-su/van-hoa-tc.
 *
 * Cac o con lai KHONG ve them gi: nut "XEM THÊM" cua chung la nut do ve san,
 * trong ro rang. Ve de len la ra hai lop chong nhau — da thu va dung ngay
 * cai bay do o dai 3M PPF.
 */
function Label({ open = false }: { readonly open?: boolean }) {
  return (
    <span className="tc-readmore-label">
      <i aria-hidden="true">{open ? "⌃" : "›"}</i>
      {open ? "THU GỌN" : "XEM THÊM"}
    </span>
  );
}
