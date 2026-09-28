import type { SliceSpec } from "@/lib/types";
import { SliceImage } from "./SliceImage";

interface CanvasSlicesProps {
  readonly slices: readonly SliceSpec[];
  readonly pageTitle: string;
}

/**
 * Anh nen cua canvas: cac lat cat truc tiep tu Figma, xep doc lien tuc.
 * Vi tri tuyet doi khong bao gio doi — hieu ung chi la wipe clip-path (.sl),
 * nen text overlay luon khop chinh xac voi nen.
 */
export function CanvasSlices({ slices, pageTitle }: CanvasSlicesProps) {
  return (
    <div className="bg" aria-hidden="true">
      {slices.map((slice, index) => (
        <SliceImage
          key={slice.src}
          slice={slice}
          index={index}
          alt={index === 0 ? `${pageTitle} — TC Auto Solutions` : ""}
        />
      ))}
    </div>
  );
}
