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
  // ── Nut "Xem tat ca cac mau man hinh" ───────────────────────────────────
  // Thiet ke khong ve nut nao dan sang danh muc day du — vi ban thiet ke cung
  // khong co trang danh muc. Khach chot dat nut ngay tren trang Man hinh o to
  // (01/10/2026) thay vi chi de o trang san pham.
  // Cho dat la khoang TRONG giua thanh phan trang (ket thuc y 2744) va chan
  // trang (bat dau y 2843), nen khong de len bat cu gi cua thiet ke.
  {
    page: "giai-phap/man-hinh",
    box: { x: 554, y: 2752, width: 332, height: 58 },
    reason:
      "Nut dan sang danh muc day du — thiet ke khong co trang danh muc nen " +
      "cung khong ve nut nay.",
  },
  // ── Ba dai nen TRANG doi sang tong toi ──────────────────────────────────
  // Ban thiet ke xen vai dai nen trang giua cac dai navy: trang chu 437px
  // (12% chieu cao), Giai phap 585px (10%), Dai ly 571px (12%). Khach bao
  // nhin "bị lệch màu rối mắt" va yeu cau dong bo mot tong (01/10/2026).
  //
  // Da kiem truoc khi doi: ba dai nay TRANG TRON trong anh nen — moi chu va
  // moi tam the deu la phan tu that ve de len. Nen chi can to lai nen
  // (tools/brand/darken-light-bands.py) roi doi mau nhung phan tu chu mau toi
  // sang trang (xem cuoi src/styles/overlay.css). Nhan mau do va nut nen do
  // giu nguyen vi chung van noi ro tren nen navy.
  {
    page: "home",
    box: { x: 0, y: 1419, width: 1440, height: 449 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau.",
  },
  {
    page: "giai-phap",
    box: { x: 0, y: 5147, width: 1440, height: 597 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau.",
  },
  {
    page: "dai-ly",
    box: { x: 0, y: 1531, width: 1440, height: 583 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau.",
  },
  // ── Mui ten cua chong anh duoc VE THAT ──────────────────────────────────
  // Hinh mui ten "‹ ›" von nam trong chong anh ve san, va chong do da bi xoa
  // khoi anh nen de thay bang anh that — mui ten mat theo. Khach bao ngay
  // (01/10/2026): "phải cho có các cái arrows như trước thì họ mới biết cần
  // hành động gì". Nay mui ten do component ve, dung vi tri va do day net cua
  // ban thiet ke (12x33, net 1,5). Vung khai noi ra moi be cho quang sang va
  // bong do khi ro chuot.
  // Xem <Chevron /> trong src/components/site/PhotoSlider.tsx.
  {
    page: "home",
    box: { x: 1323, y: 3096, width: 36, height: 57 },
    reason:
      "Mui ten chuyen anh duoc ve that vi hinh ve san da bi xoa cung voi " +
      "chong anh.",
  },
  {
    page: "dai-ly",
    box: { x: 1374, y: 2358, width: 36, height: 54 },
    reason:
      "Mui ten chuyen anh duoc ve that vi hinh ve san da bi xoa cung voi " +
      "chong anh.",
  },
  {
    page: "nhan-su",
    box: { x: 1206, y: 1485, width: 36, height: 57 },
    reason:
      "Mui ten TIEN duoc ve that vi hinh ve san da bi xoa cung voi chong anh.",
  },
  {
    page: "nhan-su",
    box: { x: 198, y: 1485, width: 36, height: 57 },
    reason:
      "Mui ten LUI duoc ve that — muc nay la muc duy nhat thiet ke ve ca hai " +
      "mui ten.",
  },
  // ── The tai ung dung bi nut de len chu ──────────────────────────────────
  // Trang "Cập nhật & vá lỗi" xep the theo luoi 3 cot x 5 hang; nut "TẢI VỀ"
  // nam o mot do cao CO DINH. Mot the co tieu de dai hon han — "[CẬP NHẬT] ES
  // File Explorer File Manager" — nen xuong hai dong, va ban thiet ke ve nut
  // DE LEN dong thu hai (khach bao 30/09/2026: "chỗ này đừng để nút đè chữ").
  // Khong the chi keo nut xuong: phan chu bi che da mat khoi anh. Nen ca cum
  // duoc xoa (tools/brand/fix-overlap-card.py) va ve lai bang phan tu that,
  // nut nam han duoi tieu de. 29 the con lai giu nguyen tung diem anh.
  {
    page: "cong-nghe/ung-dung/cap-nhat-va-loi",
    box: { x: 556, y: 1338, width: 328, height: 86 },
    reason:
      "Nut TẢI VỀ trong thiet ke ve de len dong thu hai cua tieu de; ca cum " +
      "duoc ve lai bang phan tu that de nut nam han ben duoi.",
  },
  // ── Dai "BỘ SƯU TẬP" dung lai thanh bang chuyen ──────────────────────────
  // Thiet ke ve chet ba tam anh le ra hai ben kem mui ten "‹ ›" — y la mot
  // bang chuyen, nhung ca dai nam trong anh nen nen dung yen. Khach yeu cau no
  // tu chay va bam vao tam nao thi tam do chay vao giua (30/09/2026).
  // Dai ve chet da duoc xoa (tools/brand/extract-gallery.py) va dung lai bang
  // ba tam anh GOC. Hinh hoc giu dung thiet ke: the giua 875x585 tai (282,1761)
  // — dung ti le anh goc, khong cat — moi bac cach 905px.
  // Cac tam ngoai KHONG lam nghieng, cung ly do voi dai du an.
  {
    page: "trai-nghiem/khoanh-khac",
    box: { x: 0, y: 1743, width: 1440, height: 615 },
    reason:
      "Dai 'BỘ SƯU TẬP' duoc dung lai thanh bang chuyen tu chay va bam duoc; " +
      "cac tam khong lam nghieng vi anh goc la anh phang.",
  },
  // ── Chong anh xoe: ca chong deu la anh THAT ──────────────────────────────
  // Ban thiet ke ve mot chong 3-4 tam xoe len phia tren ben phai, nhung chi
  // tam TREN CUNG la phan tu that — may tam phia sau nam trong anh nen. Tuc la
  // chung dung yen mai mai va noi dung khong lien quan gi den anh dang xem.
  // Khach goi dung ten: "ảnh bịa" (30/09/2026), va yeu cau bam vao tam nao thi
  // tam do nhay len dau.
  // Nay chong ve san da bi xoa khoi anh (tools/brand/scrub-decks.py) va ca
  // chong do component ve bang anh that. Hinh hoc giu dung ban thiet ke: moi
  // tang lui lai dich 20px sang phai va 20px len tren — do tu chinh frame goc
  // (mep phai the truoc 1334, ca chong lan toi 1374).
  // Xem src/components/site/PhotoSlider.tsx.
  {
    page: "home",
    box: { x: 448, y: 2926, width: 936, height: 436 },
    reason:
      "Chong anh 'Câu chuyện khởi nghiệp': hai tam phia sau vốn vẽ chết trong " +
      "ảnh, nay là ảnh thật và bấm vào thì nhảy lên đầu.",
  },
  {
    page: "dai-ly",
    box: { x: 640, y: 2117, width: 757, height: 476 },
    reason:
      "Chong anh 'Chân dung đại lý': hai tấm phía sau vốn vẽ chết trong ảnh, " +
      "nay là ảnh thật và bấm vào thì nhảy lên đầu.",
  },
  {
    page: "nhan-su",
    box: { x: 300, y: 1242, width: 891, height: 527 },
    reason:
      "Chong anh 'Con người TC': ba tấm phía sau vốn vẽ chết trong ảnh, nay " +
      "là ảnh thật và bấm vào thì nhảy lên đầu.",
  },
  // ── Dai anh "CÁC DỰ ÁN ĐÃ TRIỂN KHAI" dung lai thanh bang chuyen ─────────
  // Thiet ke ve chet nam tam anh nghieng dan ra hai ben — y la mot bang
  // chuyen. Khach yeu cau bam vao tam nao thi tam do chay vao giua
  // (30/09/2026), nen dai phai la phan tu that.
  // Cac tam o day KHONG nghieng: anh goc trong bo tai nguyen la anh phang, ma
  // lam nghieng bang CSS 3D thi chu tren bang hieu trong anh bi meo. Chung chi
  // nho dan va mo dan ra hai ben.
  // Xem tools/brand/extract-projects.py va ProjectCoverflow.tsx.
  {
    page: "giai-phap",
    box: { x: 0, y: 5416, width: 1440, height: 296 },
    reason:
      "Dai anh du an duoc dung lai thanh bang chuyen bam duoc; cac tam khong " +
      "lam nghieng vi anh goc la anh phang.",
  },
  {
    page: "trai-nghiem",
    box: { x: 0, y: 1442, width: 1440, height: 2034 - 1442 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau " +
      "(ra soat lai 02/10/2026, con nam dai nua ngoai ba dai da lam).",
  },
  {
    page: "cong-nghe/tien-phong-cong-nghe",
    box: { x: 0, y: 1696, width: 1440, height: 2339 - 1696 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau " +
      "(ra soat lai 02/10/2026). Xem SUB_BANDS trong tools/brand/darken-light-bands.py.",
  },
  {
    page: "giai-phap/du-an",
    box: { x: 0, y: 1376, width: 1440, height: 1881 - 1376 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau " +
      "(ra soat lai 02/10/2026). Xem SUB_BANDS trong tools/brand/darken-light-bands.py.",
  },
  {
    page: "giai-phap/du-an",
    box: { x: 0, y: 2365, width: 1440, height: 2869 - 2365 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau " +
      "(ra soat lai 02/10/2026). Xem SUB_BANDS trong tools/brand/darken-light-bands.py.",
  },
  {
    page: "nhan-su/nhan-su-tc",
    box: { x: 0, y: 1490, width: 1440, height: 2662 - 1490 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau " +
      "(ra soat lai 02/10/2026). Xem SUB_BANDS trong tools/brand/darken-light-bands.py.",
  },
  {
    page: "nhan-su/van-hoa-tc",
    box: { x: 0, y: 1891, width: 1440, height: 2559 - 1891 },
    reason:
      "Dai nen trang doi sang navy cho dong bo voi ca site — khach yeu cau " +
      "(ra soat lai 02/10/2026). Xem SUB_BANDS trong tools/brand/darken-light-bands.py.",
  },
  {
    page: "dai-ly/gallery-by-brand",
    box: { x: 0, y: 1020, width: 1440, height: 3430 - 1020 },
    reason:
      "Ba tab 5DO / 3M / NANO SUN nay bam duoc — khach hoi vi sao chua lam " +
      "(02/10/2026). Thiet ke ve san NAM bai viet giong het nhau, tieu de con " +
      "de nguyen chu 'TÊN BÀI VIẾT'; vung do duoc che di va ve lai bang san " +
      "pham that cua tung hang. Xem src/components/site/BrandTabs.tsx.",
  },
  // ── Doi thu tu muc giai phap ────────────────────────────────────────────
  {
    page: "giai-phap",
    // Mien bi hoan vi: dai MÀN HÌNH [4640,5152) duoc dua len 1920, ba muc kia
    // bi day xuong 512. Chieu cao trang khong doi.
    box: { x: 0, y: 1920, width: 1440, height: 5152 - 1920 },
    reason:
      "Khach yeu cau dua muc MÀN HÌNH Ô TÔ len tren PHIM CÁCH NHIỆT " +
      "(01/10/2026). Ban thiet ke xep PHIM -> PPF -> LOA -> MÀN HÌNH; ca bon " +
      "muc deu ve chet trong anh nen nen phai hoan vi ca dai anh lan moi toa " +
      "do tro vao do. Xem tools/brand/reorder-solutions.py.",
  },
  // ── Anh hero trang chu: bo phan chu nuong san trong anh ──────────────────
  // Ban thiet ke nuong "DRIVE · EXPERIENCE · ELEVATE" va ba dong gioi thieu
  // vao chinh tam anh hero, trong khi chinh nhung dong do cung la phan tu that
  // de doc va chon duoc. Hai ban chong khit nen binh thuong khong ai thay;
  // nhung luc phong web chua tai xong, ban that ve bang phong du phong co be
  // ngang khac — the la chu hien BONG DOI. Khach bao ba lan (29-30/09/2026).
  // Nay anh hero duoc dung tu TAM ANH GOC sach chu ("Rectangle 1.png"), chi
  // dan lai logo va cot bieu tuong; chu do phan tu that ve, mot lan duy nhat.
  // Xem tools/brand/clean-hero.py.
  {
    page: "home",
    box: { x: 270, y: 260, width: 420, height: 195 },
    reason:
      "Bo phan chu nuong san trong anh hero — chu do phan tu that ve, khong " +
      "de hai ban chong len nhau nua.",
  },
  // ── Khung quanh muc menu dang xem: xoa khoi ANH, ve lai bang phan tu that ─
  // Ban thiet ke ve mot khung bo tron quanh muc menu dang xem, NGAY TRONG anh
  // nen. Chu tren nav thi la phan tu that, rieng cai khung nam lai trong anh —
  // ma khung trong anh thi khong nhuc nhich duoc, trong khi khung truot that
  // dau dung len tren no. Thanh hai lop chong nhau, khach bao nam lan
  // (29-30/09/2026) truoc khi tim ra thu pham.
  // Nay khung ve san da bi xoa khoi anh (tools/scrub-nav.py) va khung truot
  // that la dau duy nhat: dau o muc dang xem, luot khi re chuot sang muc khac.
  // Vung khai bao noi ra 4px moi ben cho phan khu rang cua. Trang chu khong co
  // muc nao dang xem nen khong co o day.
  {
    page: "trai-nghiem",
    box: { x: 425, y: 44, width: 149, height: 34 },
    reason:
      "Khung ve san trong anh da bi xoa; khung truot that dau o muc dang xem " +
      "va luot theo chuot. Xem .tc-navpill trong src/styles/overlay.css.",
  },
  {
    page: "giai-phap",
    box: { x: 567, y: 44, width: 123, height: 34 },
    reason:
      "Khung ve san trong anh da bi xoa; khung truot that dau o muc dang xem " +
      "va luot theo chuot. Xem .tc-navpill trong src/styles/overlay.css.",
  },
  {
    page: "cong-nghe",
    box: { x: 683, y: 44, width: 140, height: 34 },
    reason:
      "Khung ve san trong anh da bi xoa; khung truot that dau o muc dang xem " +
      "va luot theo chuot. Xem .tc-navpill trong src/styles/overlay.css.",
  },
  {
    page: "dai-ly",
    box: { x: 816, y: 44, width: 94, height: 34 },
    reason:
      "Khung ve san trong anh da bi xoa; khung truot that dau o muc dang xem " +
      "va luot theo chuot. Xem .tc-navpill trong src/styles/overlay.css.",
  },
  {
    page: "nhan-su",
    box: { x: 903, y: 44, width: 117, height: 34 },
    reason:
      "Khung ve san trong anh da bi xoa; khung truot that dau o muc dang xem " +
      "va luot theo chuot. Xem .tc-navpill trong src/styles/overlay.css.",
  },
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
    page: "trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao",
    // Ca dai the "CÁC BÀI VIẾT KHÁC": x 0..1440, y 2780..3290.
    box: { x: 0, y: 2780, width: 1440, height: 510 },
    reason:
      "Thiet ke ve dai nay nhu mot HANG TRAN NGANG: the giua nam tron ven, hai " +
      "the hai ben bi cat o mep canvas — y la con nua, keo di. Khach muon no tu " +
      "cuon ngang, nen dai duoc dung lai bang phan tu that " +
      "(src/components/site/RelatedStrip.tsx) voi anh NGUYEN VEN lay tu bo tai " +
      "nguyen, chay vong khong het. Dai PHU LEN anh nen bang mot lop mau nen dac " +
      "chu KHONG xoa gi khoi anh — bo trang khoi `pages` trong related-strip.json " +
      "la moi thu ve nhu cu. Hai the ngoai cung trong thiet ke bi cat mat chu nen " +
      "tieu de cua chung dang de TRONG, cho khach xac nhan.",
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
