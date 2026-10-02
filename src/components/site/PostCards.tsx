import Link from "next/link";
import type { CtaSpot } from "@/lib/cta-links";

/**
 * Ve DE noi dung bai viet that len cac o dat cho cua ban thiet ke.
 *
 * ── Vi sao can ─────────────────────────────────────────────────────────────
 * Ban thiet ke de san nhung the bai viet mang tieu de mau "TÊN BÀI VIẾT", kem
 * mot doan than bai mau (ca nam the deu ke lai cung mot chuyen ve Pham Gia
 * Auto). Tat ca nam TRONG ANH NEN.
 *
 * `ReadMore` da gan bai that vao tung o, nhung no chi dat mot VUNG BAM TRONG
 * SUOT len nut "XEM THÊM". Ket qua la trang co lien ket dung nhung mat van
 * doc ra "TÊN BÀI VIẾT" va doan chu mau — da kiem chung bang anh chup
 * (02/10/2026): nam lien ket `/bai-viet/...` deu co mat trong HTML, con man
 * hinh thi khong doi mot chu nao. Khach chi dung cho do.
 *
 * ── Cach lam ───────────────────────────────────────────────────────────────
 * Phu mot lop DUC mau nen len vung tieu de + than bai cua the, roi ve lai
 * tieu de va mo ta that. KHONG dung toi anh nen: bo bai viet ra khoi co so du
 * lieu la the quay ve nguyen trang.
 *
 * Moi con so lay tu chinh anh thiet ke:
 *   - nen the: #03111c (do o vung trong canh tieu de);
 *   - tieu de: Unbounded 800, mau #c22326 (do duoc 184,38,42 — vien chu bi
 *     lam toi di khi khu rang cua);
 *   - ngay thang: nghieng, mau xam sang;
 *   - than bai: dung `fontSize`/`lineHeight` cua `bodyBox` trong thiet ke.
 *
 * Vung bi phu da khai trong design-deviations.ts.
 */

const BACKGROUND = "#03111c";

export interface PostCardPost {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly body: string;
  readonly publishedAt: string | null;
}

/** "Ngày 20.8.2026" — dung dang ngay ma thiet ke dang dung. */
function formatDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return null;
  }
  return `Ngày ${at.getDate()}.${at.getMonth() + 1}.${at.getFullYear()}`;
}

export function PostCards({
  spots,
  posts,
}: {
  readonly spots: readonly CtaSpot[];
  readonly posts: readonly PostCardPost[];
}) {
  if (posts.length === 0) {
    return null;
  }

  // Gan bai vao o theo dung thu tu xuat hien tren trang — giong `ReadMore`,
  // nen o nao co lien ket thi o do co chu, khong lech nhau.
  const slots = spots.filter(
    (spot) => spot.isPlaceholder && spot.headingBox && spot.bodyBox,
  );

  return (
    <>
      {slots.slice(0, posts.length).map((spot, index) => {
        const post = posts[index];
        const heading = spot.headingBox!;
        const body = spot.bodyBox!;
        const date = formatDate(post.publishedAt);

        // Phu tu TREN dinh tieu de toi sat nut "XEM THÊM".
        //
        // Noi 14px o tren chu khong phai 6: chu hoa tieng Viet co dau CHONG
        // (Ố = O + mu + sac, Ẫ = A + mu + nga) cao hon than chu hoa, va lop
        // phu co `overflow: hidden`. Voi 6px thi phan dau bi cat, "BỐN ĐIỀU"
        // doc ra thanh "BÔN ĐIÊU" — trong giong het loi thieu font, ma that
        // ra chi la bi xen.
        //
        // Duoi thi phu toi `spot.y` — mep tren vung bam cua nut. Lay
        // `body.y + body.height` van con sot dong cuoi cua doan chu mau (dong
        // bi lop mo che trong thiet ke), hien ra thanh mot vet chu xam.
        const top = heading.y - 14;
        const height = Math.max(spot.y - top, heading.height + 20);
        const left = Math.min(heading.x, body.x) - 6;
        const width = Math.max(heading.width, body.width) + 12;

        return (
          <div
            key={`${spot.x}-${spot.y}`}
            className="tc-postcard"
            style={{ left, top, width, height, background: BACKGROUND }}
          >
            <Link href={`/bai-viet/${post.slug}`} prefetch={false} className="tc-postcard-title">
              {post.title}
            </Link>
            {date ? <p className="tc-postcard-date">{date}</p> : null}
            {/* Tom tat, roi den than bai. Thiet ke lap day o nay bang khoang
                tam dong chu; chi hien moi tom tat thi the trong hoac. Phan
                thua bi `overflow: hidden` cat — dung y, vi nguoi doc bam
                "XEM THÊM" de doc tiep. */}
            {post.excerpt ? (
              <p
                className="tc-postcard-excerpt"
                style={{ fontSize: `${body.fontSize}px`, lineHeight: `${body.lineHeight}px` }}
              >
                {post.excerpt}
              </p>
            ) : null}

            {post.body
              .split(/\n{2,}/)
              .map((text) => text.trim())
              .filter(Boolean)
              .slice(0, 3)
              .map((text, order) => (
                <p
                  key={`${order}-${text.slice(0, 12)}`}
                  className="tc-postcard-body"
                  style={{ fontSize: `${body.fontSize}px`, lineHeight: `${body.lineHeight}px` }}
                >
                  {text}
                </p>
              ))}
          </div>
        );
      })}
    </>
  );
}
