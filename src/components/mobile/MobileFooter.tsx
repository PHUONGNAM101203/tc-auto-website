import { asset } from "@/lib/asset-version";
import { PHONE_HREF, SITE_CONTACT, SOCIAL } from "@/lib/site-contact";

/** Ba bieu tuong nho truoc moi dong lien he — dung nhu chan trang thiet ke. */
const PATHS = {
  phone:
    "M4 3h3l2 5-2.2 1.2a12 12 0 0 0 5.9 5.9L14 13l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 2 5.2 2 2 0 0 1 4 3Z",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3.5 2",
  pin: "M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
} as const;

/**
 * Ba bieu tuong mang xa hoi, ve giong chan trang may ban.
 *
 * Ban may ban ve san ba vong tron co bieu tuong ben trong; ban dien thoai
 * truoc day lai hien ba VIEN CHU "Facebook / Zalo" — hai ban nhin ra hai site
 * khac nhau. Khach yeu cau cho giong nhau (02/10/2026).
 *
 * Instagram van ve: thiet ke co no. Nhung TC Auto CHUA co tai khoan Instagram
 * nao (xem SOCIAL trong site-contact.ts) nen o day no la mot vong tron KHONG
 * bam duoc — dan sang mot tai khoan bia la dua nguoi doc di nham cho.
 */
const SOCIAL_PATHS: Record<string, string> = {
  facebook:
    "M14 8.5h2V5.6h-2.3C11.2 5.6 10 7 10 9v1.6H8V13h2v6h2.6v-6H15l.4-2.4h-2.8V9.2c0-.5.2-.7.7-.7Z",
  instagram:
    "M8.6 4h6.8A4.6 4.6 0 0 1 20 8.6v6.8a4.6 4.6 0 0 1-4.6 4.6H8.6A4.6 4.6 0 0 1 4 15.4V8.6A4.6 4.6 0 0 1 8.6 4Zm3.4 4.9a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2Zm4.3-1.3a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z",
  zalo: "M4.6 5h14.8v9.3H12l-4.4 3v-3H4.6Z",
};

function SocialIcon({ id }: { readonly id: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={SOCIAL_PATHS[id]} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Icon({ name }: { readonly name: keyof typeof PATHS }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Chan trang ban mobile.
 *
 * Tren desktop chan trang nam trong anh nen; o day phai dung lai bang phan tu
 * that de so dien thoai, email va muc luc deu bam duoc.
 */
/**
 * Chan trang ban dien thoai.
 *
 * KHONG co muc luc nam duoi: chan trang may ban khong co, ma hai ban phai
 * giong nhau (khach chot 02/10/2026). Danh sach muc da nam trong ngan keo
 * menu o dau trang roi — de them mot ban nua o day chi lam trang dai them.
 */
export function MobileFooter() {
  return (
    <footer className="tc-m-foot">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo PNG dong dau san */}
      <img
        className="tc-m-foot-logo"
        src={asset("/brand/logo-horizontal-on-dark.png")}
        alt="TC Auto Solutions"
        width={150}
        height={36}
      />
      <p className="tc-m-foot-slogan">{SITE_CONTACT.slogan}</p>
      <p className="tc-m-foot-pitch">{SITE_CONTACT.pitch}</p>

      <h2 className="tc-m-foot-head">KẾT NỐI VỚI TC</h2>
      <ul className="tc-m-foot-list">
        <li>
          <Icon name="phone" />
          <a href={PHONE_HREF}>{SITE_CONTACT.phone}</a>
        </li>
        <li>
          <Icon name="mail" />
          <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
        </li>
        <li>
          <Icon name="clock" />
          <span>{SITE_CONTACT.hours}</span>
        </li>
        {/* Dia chi tru so — mo thang Google Maps thay vi chi hien chu, vi tren
            dien thoai nguoi ta doc chan trang chu yeu de tim duong. */}
        <li>
          <Icon name="pin" />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${SITE_CONTACT.address}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SITE_CONTACT.address}
          </a>
        </li>
      </ul>

      {/* Ve ca ba, ke ca Instagram chua co tai khoan — giong het may ban.
          Cai nao khong co dia chi thi la vong tron tinh, khong bam duoc. */}
      <ul className="tc-m-foot-social">
        {SOCIAL.map((item) => (
          <li key={item.id}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.label} của TC Auto Solutions`}
              >
                <SocialIcon id={item.id} />
              </a>
            ) : (
              <span aria-hidden="true">
                <SocialIcon id={item.id} />
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="tc-m-foot-copy">{SITE_CONTACT.copyright}</p>
    </footer>
  );
}
