import type { Metadata } from "next";
import { FaqPage, FAQ_ROUTE } from "@/components/site/FaqPage";
import { getFaq } from "@/lib/faq";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { SITE } from "@/lib/site-config";

const DESCRIPTION =
  `${getFaq().length} câu hỏi thường gặp về màn hình ô tô Winca và Bravo, ` +
  `phim cách nhiệt, PPF, loa DEGO, bảo hành và mạng lưới đại lý của ${SITE.name}.`;

export const metadata: Metadata = {
  title: `Câu hỏi thường gặp | ${SITE.name}`,
  description: DESCRIPTION,
  alternates: { canonical: FAQ_ROUTE },
  openGraph: {
    title: "Câu hỏi thường gặp",
    description: DESCRIPTION,
    url: FAQ_ROUTE,
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function Page() {
  return <FaqPage />;
}
