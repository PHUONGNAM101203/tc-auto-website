import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  // KHONG khai bao robots o layout goc: mac dinh trang da duoc index, ma khai bao
  // o day se de xuong ca trang 404 — sinh ra hai the robots mau thuan nhau
  // ("noindex" cua Next + "index, follow" cua ta). Khu /admin tu dat noindex rieng.
  // favicon.ico / icon.png / apple-icon.png trong src/app duoc Next tu gan the <link>.
  // Anh dai dien khi chia se link, sinh tu logo chuan trong bo nhan dien.
  openGraph: {
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    /**
     * Anh chia se MAC DINH cho moi trang.
     *
     * Cac trang tu soan, trang bai viet va trang san pham khong tu khai anh —
     * khi do Facebook, Zalo hay cong cu tra loi AI khong co gi de hien, link
     * chia se ra thanh mot dong chu tran. Khai o layout goc thi moi trang
     * chua tu khai deu thua ke anh nay; trang nao co anh rieng van ghi de.
     *
     * Dung anh hero trang chu: do la tam duy nhat mang du ca logo lan tinh
     * than thuong hieu, va no da duoc toi uu san.
     */
    images: [
      {
        url: "/slices/home-0.webp",
        width: 2880,
        height: 1800,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Thiet ke Figma la canvas 1440px (khong co frame mobile). Tren man hinh nho
     canvas duoc thu vua be rong; cho phep phong to bang hai ngon de doc duoc. */
  maximumScale: 5,
  userScalable: true,
  themeColor: "#02111c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Script trong SiteLayout dat --tc-zoom len <html> TRUOC khi React hydrate
       (bat buoc, neu khong canvas 1440px se nhay mot cai khi tai trang). React
       thay the style xuat hien tu dau va bao "hydration mismatch" — day la cho
       duy nhat ta co y sua DOM truoc hydrate, nen tat canh bao dung o the nay. */
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
