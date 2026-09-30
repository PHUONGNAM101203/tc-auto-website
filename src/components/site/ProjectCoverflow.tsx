import { Coverflow } from "./Coverflow";
import { PROJECT_CENTRE, type ProjectPhoto } from "@/lib/projects";

/**
 * Dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" o cuoi trang Giai phap.
 * Chi la mot lop mong: hinh hoc rieng, con cach chay thi dung chung voi dai
 * "BỘ SƯU TẬP" — xem src/components/site/Coverflow.tsx.
 */

/** Khoang cach giua hai bac, do tu ban thiet ke. */
const STEP = 426;

export function ProjectCoverflow({
  photos,
}: {
  readonly photos: readonly ProjectPhoto[];
}) {
  return (
    <Coverflow
      photos={photos}
      centre={PROJECT_CENTRE}
      step={STEP}
      label="Các dự án đã triển khai"
    />
  );
}
