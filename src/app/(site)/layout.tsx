import { CanvasZoom } from "@/components/canvas/CanvasZoom";
import { JsonLd } from "@/components/site/JsonLd";
import { organizationLd, websiteLd } from "@/lib/structured-data";
import { MotionLayer } from "@/components/motion/MotionLayer";

/**
 * Hai viec phai lam TRUOC lan ve dau tien.
 *
 * 1) `--tc-zoom`: dat truoc khi canvas duoc parse nen khong bao gio thay khung
 *    1440px nhay ve ti le dung (khong FOUC, khong layout shift).
 *    Script nay CHI lo lan paint dau tien. Viec dong bo tiep theo — doi kich
 *    thuoc, va quan trong hon la khi vao nhom (site) bang dieu huong phia
 *    client tu trang 404 — do <CanvasZoom /> dam nhan, vi script chen bang
 *    innerHTML khong chay lai.
 *
 * 2) `tc-fontwait`: giu chu tren canvas CHUA VE cho toi khi phong san sang.
 *
 *    Ban thiet ke nuong san mot so doan chu vao chinh anh nen (vi du doan gioi
 *    thieu duoi hero trang chu), dong thoi cung doan do la phan tu that de doc
 *    va chon duoc. Binh thuong hai ban chong khit nen mat khong phan biet duoc.
 *    Nhung luc phong web chua tai xong, ban THAT duoc ve bang phong du phong co
 *    be ngang khac — the la chu hien thanh BONG DOI. Khach da bao hai lan.
 *
 *    Trong luc cho, de anh nen lam viec (chu nuong san trong do von da dung
 *    kieu), roi moi ve chu that de len. Cho nay rat ngan vi woff2 duoc tai cung
 *    luc voi CSS; van dat han 2 giay phong khi mang hong.
 *
 *    Lam ngay trong script noi tuyen chu khong doi React gan xong: cang som
 *    cang it kha nang kip ve mot khung hinh bi doi. Va neu nguoi dung tat
 *    JavaScript thi lop nay khong bao gio duoc them vao — chu hien binh thuong,
 *    dung chieu an toan.
 */
const ZOOM_BOOTSTRAP = `(function(){
var d=document.documentElement;
d.style.setProperty('--tc-zoom',String(Math.max(d.clientWidth,320)/1440));
d.classList.add('tc-fontwait');
var done=function(){d.classList.remove('tc-fontwait')};
try{if(document.fonts&&document.fonts.ready){document.fonts.ready.then(done)}}catch(e){}
setTimeout(done,2000);
})();`;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tc-root">
      {/* Phap nhan va trang web — khai MOT lan cho moi trang trong nhom. Cac
          mau khac (duong dan phan cap, san pham, bai viet) tro ve day bang
          `@id`. Xem src/lib/structured-data.ts. */}
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />

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
