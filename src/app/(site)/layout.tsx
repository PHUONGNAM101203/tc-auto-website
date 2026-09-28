import { CanvasZoom } from "@/components/canvas/CanvasZoom";
import { MotionLayer } from "@/components/motion/MotionLayer";

/**
 * Dat --tc-zoom TRUOC khi canvas duoc parse nen khong bao gio thay
 * khung 1440px nhay ve ti le dung (khong FOUC, khong layout shift).
 *
 * Script nay CHI lo lan paint dau tien. Viec dong bo tiep theo — doi kich thuoc,
 * va quan trong hon la khi vao nhom (site) bang dieu huong phia client tu trang
 * 404 — do <CanvasZoom /> dam nhan, vi script chen bang innerHTML khong chay lai.
 */
const ZOOM_BOOTSTRAP = `(function(){
var d=document.documentElement;
d.style.setProperty('--tc-zoom',String(Math.max(d.clientWidth,320)/1440));
})();`;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tc-root">
      <script dangerouslySetInnerHTML={{ __html: ZOOM_BOOTSTRAP }} />
      <CanvasZoom />

      {/* Man cho tai trang dau — tu an sau khi anh nen dau tien san sang */}
      <div className="tc-boot" aria-hidden="true">
        <div className="tc-boot-bar" />
      </div>

      <div className="tc-progress" aria-hidden="true" />
      <div className="tc-curtain" aria-hidden="true" />
      <div className="tc-cursor" aria-hidden="true" />

      {children}

      <MotionLayer />
    </div>
  );
}
