/**
 * Nhung cho CO Y lam khac ban thiet ke.
 *
 * Cam ket cua du an la lech 0 pixel so voi Figma. Moi ngoai le phai duoc ghi o
 * day kem LY DO, va gate so pixel doc danh sach nay de khong bao dong nham.
 * Khong duoc sua giao dien ma khong them muc vao day.
 */

export interface Deviation {
  readonly page: string;
  /** Vung bi anh huong trong he toa do canvas 1440px. */
  readonly box: { x: number; y: number; width: number; height: number };
  readonly reason: string;
}

export const DESIGN_DEVIATIONS: readonly Deviation[] = [
  // ── Bon khoi chu bi designer DAN LAI CHINH NO 2-4 lan ────────────────────
  // Cung mot cau, khong sai mot dau phay. Tren khung co dinh cua Figma phan
  // thua bi cat nen khong lo ra, nhung o day chu chay tu do thi hien het ca
  // ba bon ban sao — doc ra la thay ngay. Da bo phan lap (xem drop_repeat()
  // trong tools/parse-prototype.py); vung duoi day phu het chieu cao CU.
  {
    page: "home",
    // home-009: "Mỗi giải pháp..." lap 4 lan, khoi cu cao 136px tai (82,1631).
    box: { x: 76, y: 1625, width: 404, height: 150 },
    reason:
      "Khoi chu bi ve lap 4 lan trong ban thiet ke — cung mot cau y nguyen. Da bo " +
      "phan lap, giu lai mot ban.",
  },
  {
    page: "home",
    // home-017: lap 3 lan, khoi cu cao 85px tai (976,2716).
    box: { x: 970, y: 2710, width: 412, height: 100 },
    reason: "Khoi chu bi ve lap 3 lan trong ban thiet ke. Da bo phan lap.",
  },
  {
    page: "cong-nghe",
    // cong-nghe-006: lap 2 lan, khoi cu cao 100px tai (68,1344).
    box: { x: 62, y: 1338, width: 542, height: 114 },
    reason: "Khoi chu bi ve lap 2 lan trong ban thiet ke. Da bo phan lap.",
  },
  {
    page: "giai-phap",
    // giai-phap-009: lap 3 lan, khoi cu cao 180px tai (812,3399).
    box: { x: 806, y: 3393, width: 512, height: 194 },
    reason: "Khoi chu bi ve lap 3 lan trong ban thiet ke. Da bo phan lap.",
  },
  {
    page: "trai-nghiem/ban-sac-rieng",
    // Khoi trac nghiem: tieu de y1444, nut cuoi ket thuc y1989.
    box: { x: 310, y: 1424, width: 830, height: 572 },
    reason:
      "Thiet ke ve chet MOT cau hoi trac nghiem vao anh, kem nut 'CÂU THIẾP THEO' — " +
      "tuc y la mot chuoi cau hoi, nhung frame chi co cau dau. Khoi nay da tach ra " +
      "thanh dieu khien that (tools/brand/extract-quiz.py) de bam chon duoc, go duoc " +
      "cau tra loi 'Khác' va di tiep sang cau sau. Cau dau giu nguyen tung chu cua " +
      "thiet ke voi dung co chu do lai; bon cau sau va phan ket qua do chung ta viet.",
  },
  {
    page: "giai-phap/ppf",
    // Dai the "3M PPF": bon the rong 354 cao 444 tai y1090, buoc 434.
    box: { x: 0, y: 1086, width: 1440, height: 452 },
    reason:
      "Thiet ke ve chet bon the '3M PPF' vao anh, hai the ngoai cung bi cat o mep canvas " +
      "va co mot mui ten moi ben bao 'con nua'. De hai mui ten do bam duoc, dai the da " +
      "tach ra thanh phan tu that (tools/brand/extract-ppf-cards.py). Hai the giua giu " +
      "nguyen anh cat tu thiet ke nen trung khop tuyet doi; hai the bi cat duoc dung lai " +
      "tu nen the rong + anh minh hoa roi, chu do CSS ve theo dung co chu do tu the giua. " +
      "Luc dung yen chi hai the bi cat la khac thiet ke — va chi khac o phan chu von " +
      "khong doc duoc trong thiet ke.",
  },
  {
    page: "home",
    // O sang cua muc nav "TRẢI NGHIỆM": .nv.act rong 141px, cao 26px, tai x435 y48.
    box: { x: 430, y: 44, width: 152, height: 36 },
    reason:
      "Frame Home.png goc danh dau muc nav 'TRẢI NGHIỆM' dang duoc chon, nhung day la " +
      "TRANG CHU chu khong phai trang Trải nghiệm — gan chac la designer copy header tu " +
      "frame khac sang. De nguyen thi nguoi dung tuong minh dang o trang Trai nghiem. " +
      "Da bo danh dau nay o trang chu.",
  },
  {
    page: "home",
    // Vach chi muc cua bang hero: x 640..799, y 826, cao 2px.
    box: { x: 628, y: 816, width: 184, height: 20 },
    reason:
      "Vach chi muc bang hero duoc VE THAT thay vi de nguyen hinh trong anh nen. " +
      "Anh nen cua slide 1 da duoc xoa vach ve san (tools/brand/clean-hero.py), vi neu " +
      "giu lai thi vach bi ve doi va vach sang cua anh (luon la vach thu 3) khong khop " +
      "voi vach sang that chay theo slide dang xem. Vi tri va kich thuoc lay dung so do " +
      "tu frame goc: y=826, x 640..800, vach dang chon rong 84px.",
  },
  {
    page: "home",
    box: { x: 12, y: 420, width: 50, height: 60 },
    reason:
      "Mui ten trai cua bang hero duoc VE THAT thay vi de nguyen hinh trong anh nen. " +
      "Ly do: anh nen chi co mui ten o slide 1; cac slide sau khong co, nen phai tu ve " +
      "thi nut chuyen anh moi hien tren moi slide va bam duoc bang ban phim.",
  },
  {
    page: "home",
    box: { x: 1380, y: 418, width: 52, height: 60 },
    reason:
      "Mui ten phai cua bang hero — cung ly do voi mui ten trai: ve that de hien duoc " +
      "tren moi slide chu khong chi slide dau, va de co the bam bang ban phim.",
  },
  {
    page: "home",
    // Ca dai the muc "Giải pháp": x 539..1440, y 1458..1829.
    box: { x: 539, y: 1458, width: 901, height: 371 },
    reason:
      "Dai 4 the muc 'Giải pháp' duoc TACH RA khoi anh nen thanh phan tu that " +
      "(tools/brand/extract-solution-cards.py) de mui ten trang ve san trong thiet ke " +
      "bam duoc va dai the truot ngang duoc. Ba the dau la anh CAT NGUYEN tu ban thiet " +
      "ke — ke ca chu — nen luc dung yen khong doi mot pixel. The thu 4 (LOA/DEGO) " +
      "trong thiet ke bi cat o mep canvas nen khong co chu; anh lay tu bo tai nguyen " +
      "roi va chu do CSS ve theo dung mach cua ba the kia (day tieu de cach day the " +
      "37px, day chu phu cach 19,7px). So buoc truot tinh tu so the co that.",
  },
  {
    page: "home",
    // Bon o muc "Công nghệ": x 128..1312, y 2062..2400.
    box: { x: 128, y: 2062, width: 1184, height: 338 },
    reason:
      "Bon o INNOVATION / APPLICATIONS / WARRANTY / EXPERIENCE LAB duoc TACH RA khoi " +
      "anh nen thanh bon anh rieng (tools/brand/extract-lift-cards.py) de ro chuot vao " +
      "o nao thi o do noi len. Anh cua tung o giu nguyen 100% — ke ca chu — nen luc " +
      "khong tro chuot man hinh trung khop voi thiet ke; chi khac la nen phia sau da " +
      "duoc dung lai (noi suy doc) o cho bon o tung nam.",
  },
  {
    page: "home",
    // Tam anh truoc cua muc "Câu chuyện khởi nghiệp".
    box: { x: 458, y: 2976, width: 876, height: 376 },
    reason:
      "Thiet ke ve mot mui ten '›' tren chong anh muc 'Câu chuyện khởi nghiệp' — y la " +
      "con anh nua. De mui ten do bam duoc, mot lop anh that duoc PHU dung len tam anh " +
      "truoc (tools/brand/extract-photo-sliders.py). Slide dau chinh la anh CAT TU ban " +
      "thiet ke nen trang thai ban dau khong doi mot pixel; hai slide sau lay tu bo tai " +
      "nguyen roi, giu nguyen kenh trong suot nen cac lop anh phia sau van hien ra. " +
      "KHONG xoa gi khoi anh nen.",
  },
  {
    page: "cong-nghe",
    // Header: vung o tim kiem.
    box: { x: 1105, y: 18, width: 280, height: 74 },
    reason:
      "Ban PROTOTYPE export ra mot MANG TOI dac o cho o tim kiem tren header trang " +
      "Cong nghe, trong khi ban THIET KE ve o tim kiem binh thuong tren nen troi. " +
      "Vung nay duoc va lai bang dung pixel cua ban thiet ke " +
      "(tools/patch-from-design.py) — tuc la lech so voi prototype nhung DUNG so voi " +
      "thiet ke. O tim kiem that nam trung khit len o ve san (1123/37/235/30).",
  },
  {
    page: "cong-nghe",
    // Ruot cua ba the muc "Ứng dụng" — khung the thi khong dong toi.
    box: { x: 163, y: 1984, width: 1112, height: 369 },
    reason:
      "RUOT ba the muc 'Ứng dụng' (anh minh hoa + tieu de + phu de) duoc tach ra khoi " +
      "anh nen (tools/brand/extract-cards.py) de ro chuot vao the nao thi ruot the do " +
      "nhac len duoc; bam la vao thang trang cua muc do. KHUNG cua " +
      "tung the van nam nguyen trong anh nen, dung vi tri va kich thuoc thiet ke ve — " +
      "khung khong he xe dich. Nen ben trong khung duoc dung lai bang noi suy " +
      "ngang tung hang; rieng khung giua muon nen cua khung ben vi anh cuc quang trai kin " +
      "ca ruot. O trang thai ban dau man hinh trung khop voi thiet ke.",
  },
  {
    page: "dai-ly",
    // Hai the muc "Câu chuyện đồng hành": x 74..820, y 1570..2073.
    box: { x: 74, y: 1570, width: 746, height: 503 },
    reason:
      "Hai the muc 'Câu chuyện đồng hành' duoc tach ra khoi anh nen thanh hai anh rieng " +
      "(tools/brand/extract-lift-cards.py) de ro chuot vao the nao thi the do noi len. " +
      "Anh cua tung the giu nguyen 100% tu ban thiet ke; nen phia sau la trang thuan nen " +
      "chi can to trang lai cho hai the vua roi.",
  },
  {
    page: "giai-phap",
    // Ba the "PHIM CÁCH NHIỆT": x 49..1384, y 2205..2902. Cong them le cho vien sang.
    box: { x: 40, y: 2199, width: 1354, height: 712 },
    reason:
      "Ba the 'PHIM CÁCH NHIỆT 3M / NANO SUN / 5DO' duoc tach ra khoi anh nen thanh ba " +
      "anh rieng (tools/brand/extract-lift-cards.py) de ro chuot vao the nao thi the do " +
      "noi len va bam duoc sang trang cua tung loai phim. Cung ky thuat voi dai the o " +
      "trang chu va trang dai ly. Anh cua tung the giu nguyen 100% tu ban thiet ke — ke " +
      "ca chu — nen luc khong tro chuot thi trung khop; chi con lech o vien la sai so " +
      "nen WebP.",
  },
  {
    page: "cong-nghe",
    // Ca khoi trai cua muc "Tien phong cong nghe": x 60..700, y 1000..1540.
    box: { x: 55, y: 995, width: 655, height: 550 },
    reason:
      "Ban THIET KE 28/09 gop hai khoi lam mot: bo tieu de phu 'NGHIEN CUU & " +
      "PHAT TRIEN' cung mot nut 'TIM HIEU THEM' thua o cot trai, roi don chu " +
      "len duoi tieu de chinh (tieu de xuong +102px, doan chu va nut xuong " +
      "+51px). Site da lam theo thiet ke moi — xem tools/patch-page-items.py. " +
      "Nhung PROTOTYPE ma gate nay doi chieu van la ban 21/09, con nguyen ca " +
      "hai khoi, nen vung nay CHAC CHAN lech. Go muc nay ngay khi co ban " +
      "export prototype moi.",
  },
  // Ap cho 10 trang danh sach — hop cu the doc tu src/data/detected-pagination.json.
  {
    page: "*listing*",
    box: { x: 591, y: 0, width: 257, height: 56 },
    reason:
      "Bo phan trang duoc VE THAT thay vi de nguyen hinh trong anh nen. Thiet ke ve " +
      "cung '1 2 3 …' nhung so trang phai suy ra tu so bai viet co that: danh sach nao " +
      "moi du noi dung mot trang thi chi duoc hien mot so. Hinh ve san da bi xoa khoi " +
      "anh (tools/scrub-slices.py), neu khong thi so trang trong anh mau thuan voi so " +
      "trang thuc. Toa do y khac nhau theo tung trang.",
  },
];

export function deviationsFor(page: string): readonly Deviation[] {
  return DESIGN_DEVIATIONS.filter((item) => item.page === page);
}
