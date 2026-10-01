/**
 * Vung bam tren 6 TRANG CHINH, dat de len cho chu da ve chet trong anh nen.
 *
 * Khac 31 trang con (co `getHotspots` doc tu bo do nut tu dong), sau trang
 * chinh dung tu prototype: hau het chu la phan tu that nen tu co lien ket.
 * Nhung vai cho chu lai nam TRONG anh — vi du dong "› XEM THÊM" duoi muc DEGO
 * tren trang Giai phap. Nhung cho do khai o day.
 *
 * Toa do do tu chinh lat nen, theo he toa do canvas 1440px.
 */

export interface MainHotspot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly href: string;
  readonly label: string;
}

const SPOTS: Readonly<Record<string, readonly MainHotspot[]>> = {
  "giai-phap": [
    {
      // "› XEM THÊM" duoi muc DEGO. Do duoc: chu nam o x 84..200, y 4470..4492;
      // vung bam noi rong ra cho de bam.
      x: 76,
      y: 4458,
      w: 140,
      h: 46,
      href: "/giai-phap/loa/dego",
      label: "Xem thêm về loa DEGO",
    },
  ],
};

export function getMainHotspots(slug: string): readonly MainHotspot[] {
  return SPOTS[slug] ?? [];
}
