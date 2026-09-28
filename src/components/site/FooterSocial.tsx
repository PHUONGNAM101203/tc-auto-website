import { SOCIAL, SOCIAL_BOX } from "@/lib/site-contact";

/**
 * Vung bam cho ba bieu tuong mang xa hoi ve san trong chan trang.
 *
 * Bieu tuong da co trong anh nen roi, nen day chi la o bam trong suot dat dung
 * len tren — khong ve them gi, khong lam lech mot pixel nao.
 */
export function FooterSocial({ pageHeight }: { readonly pageHeight: number }) {
  return (
    <>
      {SOCIAL.filter((item) => item.href).map((item) => (
        <a
          key={item.id}
          href={item.href as string}
          target="_blank"
          rel="noopener noreferrer"
          className="tc-hotspot rv"
          data-rv="scale"
          aria-label={`${item.label} của TC Auto Solutions`}
          style={{
            left: `${SOCIAL_BOX.xs[item.id as keyof typeof SOCIAL_BOX.xs]}px`,
            top: `${pageHeight - SOCIAL_BOX.fromBottom}px`,
            width: `${SOCIAL_BOX.size}px`,
            height: `${SOCIAL_BOX.size}px`,
            borderRadius: "50%",
          }}
        />
      ))}
    </>
  );
}
