import Link from "next/link";
import { asset } from "@/lib/asset-version";
import { PHONE_HREF, SITE_CONTACT, SOCIAL } from "@/lib/site-contact";
import type { NavSpec } from "@/lib/types";

/** Ba bieu tuong nho truoc moi dong lien he — dung nhu chan trang thiet ke. */
const PATHS = {
  phone:
    "M4 3h3l2 5-2.2 1.2a12 12 0 0 0 5.9 5.9L14 13l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 2 5.2 2 2 0 0 1 4 3Z",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3.5 2",
  pin: "M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
} as const;

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
export function MobileFooter({ nav }: { readonly nav: readonly NavSpec[] }) {
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

      <ul className="tc-m-foot-social">
        {SOCIAL.filter((item) => item.href).map((item) => (
          <li key={item.id}>
            <a href={item.href as string} target="_blank" rel="noopener noreferrer">
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      {nav.length > 0 && (
        <nav className="tc-m-foot-nav" aria-label="Mục lục">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <p className="tc-m-foot-copy">{SITE_CONTACT.copyright}</p>
    </footer>
  );
}
