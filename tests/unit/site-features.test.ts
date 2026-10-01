import { describe, expect, it } from "vitest";
import { getAppCards } from "@/lib/app-cards";
import { toParagraphs } from "@/lib/cta-links";
import { getPhotoSliders, nextSlide, prevSlide } from "@/lib/photo-sliders";
import { getLiftCards } from "@/lib/lift-cards";
import {
  LOOP_STEP,
  SOLUTION_CARD,
  SOLUTION_CARDS,
  SOLUTION_PITCH,
  cardOpacity,
  offsetAt,
  repeatedCards,
  stripWidth,
  visibleCount,
} from "@/lib/solution-cards";
import { getAuthoredSlugs } from "@/lib/authored-pages";
import { getProducts } from "@/lib/products";
import { getSpotArticles } from "@/lib/spot-articles";
import { getCtaSpots, getCtaStats } from "@/lib/cta-links";
import { DESIGN_DEVIATIONS, deviationsFor } from "@/lib/design-deviations";
import { buildPageList, getPagination, hasPagination, MAX_VISIBLE } from "@/lib/pagination";
import { getAllSubPages } from "@/lib/subpages";

describe("phân trang", () => {
  it("chỉ gắn cho các trang đã kiểm bằng mắt", () => {
    const withPager = getAllSubPages().filter((p) => hasPagination(p.slug));
    expect(withPager).toHaveLength(10);
  });

  it("hộp phân trang nằm trong khung trang và trên phần chân trang", () => {
    for (const page of getAllSubPages()) {
      const box = getPagination(page.slug)?.box;
      if (!box) continue;

      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1440);
      expect(box.y).toBeGreaterThan(0);
      // Phai nam TREN khoi chan trang (chan trang chiem 250px cuoi).
      expect(box.y + box.height, page.slug).toBeLessThan(page.height - 200);
    }
  });

  it("mọi hộp phân trang đều cùng cột và cùng bề rộng đo từ thiết kế", () => {
    for (const page of getAllSubPages()) {
      const box = getPagination(page.slug)?.box;
      if (!box) continue;
      expect(box.x, page.slug).toBe(591);
      expect(box.width, page.slug).toBe(257);
      // Chieu cao KHONG dong nhat: hai trang co vien sang hat xuong them nen
      // hop do duoc cao hon vai pixel (xem CORRECTIONS trong detect-pagination.py).
      expect(box.height, page.slug).toBeGreaterThanOrEqual(56);
      expect(box.height, page.slug).toBeLessThanOrEqual(70);
    }
  });

  it("số trang tính từ dữ liệu, không ghi cứng", () => {
    // Thiet ke ve "1 2 3 …" nhung do chi la hinh minh hoa. Hien moi danh sach
    // chi du noi dung MOT trang, nen phai hien dung mot so.
    for (const page of getAllSubPages()) {
      const model = getPagination(page.slug);
      if (!model) continue;
      const expected = Math.max(1, Math.ceil(model.itemsAvailable / model.perPage));
      expect(model.pageCount, page.slug).toBe(expected);
      expect(model.pages.filter((p) => p !== null)).toHaveLength(
        Math.min(expected, MAX_VISIBLE),
      );
    }
  });

  it("danh sách số trang rút gọn đúng khi nhiều trang", () => {
    expect(buildPageList(1)).toEqual([1]);
    expect(buildPageList(2)).toEqual([1, 2]);
    expect(buildPageList(3)).toEqual([1, 2, 3]);
    // Nhieu hon thi hien 3 so dau roi dau "…"
    expect(buildPageList(7)).toEqual([1, 2, 3, null]);
  });

  it("trang không có phân trang trả về null", () => {
    expect(getPagination("khong-ton-tai")).toBeNull();
    expect(hasPagination("khong-ton-tai")).toBe(false);
  });
});

describe("nút xem thêm", () => {
  it("mọi vùng bấm nằm trong khung trang", () => {
    for (const page of getAllSubPages()) {
      for (const spot of getCtaSpots(page.slug)) {
        expect(spot.x).toBeGreaterThanOrEqual(-10);
        expect(spot.x + spot.w).toBeLessThanOrEqual(1450);
        expect(spot.y).toBeGreaterThan(0);
        expect(spot.y + spot.h, page.slug).toBeLessThan(page.height);
      }
    }
  });

  it("vùng bấm đủ lớn để chạm được", () => {
    for (const page of getAllSubPages()) {
      for (const spot of getCtaSpots(page.slug)) {
        expect(spot.w).toBeGreaterThanOrEqual(40);
        expect(spot.h).toBeGreaterThanOrEqual(24);
      }
    }
  });

  it("nút có dịch đến thì trỏ tới trang có thật", () => {
    // Gom CA trang chi tiet san pham: bo thiet ke khong ve trang cho san pham
    // nao nen chung do ta dung, nhung nut "XEM THÊM" tren /giai-phap/man-hinh
    // van tro thang toi do. Xem src/lib/products.ts.
    //
    // Va ca trang bai viet mo ra tu chinh nut "XEM THÊM" — khach chot
    // 01/10/2026 rang nut do phai dan sang trang rieng chu khong xo chu tai
    // cho. Xem src/lib/spot-articles.ts.
    const routes = new Set([
      ...getAllSubPages().map((p) => p.route),
      ...getProducts().map((p) => p.route),
      ...getSpotArticles().map((a) => a.route),
      // Va cac trang do ta tu soan cho cho thiet ke khong ve — vi du trang
      // "Loa DEGO": ban thiet ke de ten mau "Loa ..." cho nam the va dan nham
      // ca sau doan mo ta sang chu cua phim 3M, nen sau nut deu tro ve day.
      ...getAuthoredSlugs().map((slug) => `/${slug}`),
    ]);
    for (const page of getAllSubPages()) {
      for (const spot of getCtaSpots(page.slug)) {
        if (spot.href) {
          expect(routes.has(spot.href), `${page.slug} -> ${spot.href}`).toBe(true);
        }
      }
    }
  });

  it("thống kê phản ánh đúng tình trạng nội dung của thiết kế", () => {
    const stats = getCtaStats();
    expect(stats.total).toBe(stats.linked + stats.placeholder + stats.pending);
    expect(stats.total).toBeGreaterThan(40);
    // Thiet ke con nhieu o de tieu de mau "TÊN BÀI VIẾT" — day la thuc te can bao user.
    expect(stats.placeholder).toBeGreaterThan(0);
  });

  it("trang không có nút nào trả về mảng rỗng", () => {
    expect(getCtaSpots("khong-ton-tai")).toEqual([]);
  });

  it("nút xổ ra được nội dung thật đọc từ thiết kế", () => {
    const withBody = getAllSubPages()
      .flatMap((p) => getCtaSpots(p.slug))
      .filter((s) => s.body.length > 0);
    // Chu bi lop mo che van duoc ve that trong anh nen OCR doc duoc — nho vay
    // bam "XEM THÊM" moi co gi de xo ra.
    expect(withBody.length).toBeGreaterThan(40);
  });

  it("nội dung không lẫn chữ in trên ảnh minh hoạ cột bên cạnh", () => {
    for (const page of getAllSubPages()) {
      for (const spot of getCtaSpots(page.slug)) {
        for (const line of spot.body) {
          // "NANO SUN" la chu tren logo trong anh minh hoa, khong phai noi dung bai.
          expect(line, `${page.slug}: lẫn chữ từ ảnh`).not.toBe("NANO SUN");
        }
      }
    }
  });
});

describe("sai lệch có chủ đích so với thiết kế", () => {
  it("mỗi sai lệch đều ghi rõ lý do", () => {
    expect(DESIGN_DEVIATIONS.length).toBeGreaterThan(0);
    for (const item of DESIGN_DEVIATIONS) {
      expect(item.reason.length, item.page).toBeGreaterThan(40);
      expect(item.box.width).toBeGreaterThan(0);
      expect(item.box.height).toBeGreaterThan(0);
    }
  });

  it("mọi sai lệch đều nằm trong khung canvas", () => {
    for (const item of DESIGN_DEVIATIONS) {
      expect(item.box.x).toBeGreaterThanOrEqual(0);
      expect(item.box.x + item.box.width).toBeLessThanOrEqual(1440);
    }
  });

  it("tra cứu theo trang trả về đúng phần của trang đó", () => {
    const home = deviationsFor("home");
    expect(home.length).toBeGreaterThan(0);
    expect(home.every((d) => d.page === "home")).toBe(true);
    // Trang khong co sai lech rieng thi rong. Dung mot trang KHONG nam trong
    // danh sach — "giai-phap" tung dung o day nhung gio da co sai lech (khoi
    // chu bi ve lap 3 lan), nen doi sang trang khac.
    expect(deviationsFor("khong-ton-tai")).toEqual([]);
  });
});

describe("ba thẻ Ứng dụng trên trang Công nghệ", () => {
  const cards = getAppCards("cong-nghe");

  it("trang Công nghệ có đúng 3 thẻ, trang khác không có", () => {
    expect(cards).toHaveLength(3);
    expect(getAppCards("giai-phap")).toEqual([]);
    expect(getAppCards("khong-ton-tai")).toEqual([]);
  });

  it("ruột luôn nằm gọn bên trong khung của chính nó", () => {
    for (const card of cards) {
      const { frame, content } = card;
      expect(content.x, card.title).toBeGreaterThan(frame.x);
      expect(content.y, card.title).toBeGreaterThan(frame.y);
      expect(content.x + content.width).toBeLessThan(frame.x + frame.width);
      expect(content.y + content.height).toBeLessThanOrEqual(frame.y + frame.height);
    }
  });

  it("khung nằm trong canvas và không chồng lên nhau", () => {
    const byX = [...cards].sort((a, b) => a.frame.x - b.frame.x);
    for (const card of byX) {
      expect(card.frame.x).toBeGreaterThanOrEqual(0);
      expect(card.frame.x + card.frame.width).toBeLessThanOrEqual(1440);
      expect(card.frame.width).toBeGreaterThan(100);
      expect(card.frame.height).toBeGreaterThan(100);
    }
    for (let i = 1; i < byX.length; i += 1) {
      expect(
        byX[i].frame.x,
        `khung "${byX[i].title}" chồng lên "${byX[i - 1].title}"`,
      ).toBeGreaterThanOrEqual(byX[i - 1].frame.x + byX[i - 1].frame.width);
    }
  });

  it("mọi thẻ đều dẫn thẳng tới một trang có thật", () => {
    const routes = new Set(getAllSubPages().map((p) => p.route));
    expect(cards.every((card) => Boolean(card.href))).toBe(true);
    for (const card of cards) {
      expect(routes.has(card.href), `${card.title} -> ${card.href}`).toBe(true);
    }
  });
});

describe("dải thẻ Giải pháp trên trang chủ", () => {
  it("mọi thẻ trỏ tới trang có thật", () => {
    const routes = new Set(getAllSubPages().map((p) => p.route));
    for (const card of SOLUTION_CARDS) {
      expect(routes.has(card.href), `${card.title} -> ${card.href}`).toBe(true);
    }
  });

  it("chỉ thẻ bị cắt ở mép canvas mới phải vẽ chữ bằng CSS", () => {
    const cssLabels = SOLUTION_CARDS.filter((card) => card.labelInCss);
    expect(cssLabels).toHaveLength(1);
    // The cuoi cung la the tho ra ngoai mep — dung no moi thieu chu.
    expect(cssLabels[0].id).toBe(SOLUTION_CARDS[SOLUTION_CARDS.length - 1].id);
  });

  it("dải rộng đúng theo số thẻ, không viết cứng", () => {
    expect(stripWidth(1)).toBe(SOLUTION_CARD.width);
    expect(stripWidth(4)).toBe(3 * SOLUTION_PITCH + SOLUTION_CARD.width);
  });

  it("lặp danh sách đủ để khung nhìn không bao giờ hở", () => {
    const repeated = repeatedCards();
    // Phai du the cho nhip cuoi cung cua mot vong van con the lap day khung nhin.
    expect(repeated.length).toBeGreaterThanOrEqual(SOLUTION_CARDS.length + visibleCount());
    // Lap lai dung thu tu, va khoa khong duoc trung.
    expect(repeated.map((c) => c.id).slice(0, SOLUTION_CARDS.length)).toEqual(
      SOLUTION_CARDS.map((c) => c.id),
    );
    expect(new Set(repeated.map((c) => c.key)).size).toBe(repeated.length);
  });

  it("chạy tròn một vòng thì trùng khít vị trí ban đầu", () => {
    expect(LOOP_STEP).toBe(SOLUTION_CARDS.length);
    // Moi the o nhip LOOP_STEP nam dung cho cua the tuong ung o nhip 0.
    const repeated = repeatedCards();
    for (let i = 0; i < SOLUTION_CARDS.length; i += 1) {
      const atZero = i * SOLUTION_PITCH - offsetAt(0);
      const atLoop = (i + LOOP_STEP) * SOLUTION_PITCH - offsetAt(LOOP_STEP);
      expect(atLoop).toBe(atZero);
      expect(repeated[i + LOOP_STEP].id).toBe(repeated[i].id);
    }
  });
});

describe("ghép dòng OCR thành đoạn văn", () => {
  it("nối các dòng của cùng một đoạn lại với nhau", () => {
    const lines = [
      "TC AUTO ứng dụng công nghệ tiên tiến để tạo nên những giải pháp vượt trội,",
      "tối ưu hiệu suất, nâng cao trải nghiệm và đồng hành cùng mọi hành trình.",
      "người dùng.",
    ];
    const paragraphs = toParagraphs(lines);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toContain("vượt trội, tối ưu hiệu suất");
  });

  it("xuống đoạn ở dòng vừa ngắn vừa kết thúc bằng dấu chấm", () => {
    const lines = [
      "Câu mở đầu của đoạn thứ nhất chạy dài hết chiều ngang của cột chữ này,",
      "và còn kéo sang dòng thứ hai cũng dài đúng bằng chiều ngang của cột,",
      "kết thúc ở đây.",
      "Đoạn thứ hai bắt đầu và cũng chạy dài hết chiều ngang của cột chữ này,",
      "rồi dừng lại.",
    ];
    expect(toParagraphs(lines)).toHaveLength(2);
  });

  it("bỏ dòng trống và không mất chữ nào", () => {
    const lines = ["  ", "Một dòng.", "", "Hai dòng nữa nối tiếp nhau ở đây nhé."];
    const joined = toParagraphs(lines).join(" ");
    expect(joined).toContain("Một dòng.");
    expect(joined).toContain("Hai dòng nữa");
    expect(toParagraphs([])).toEqual([]);
    expect(toParagraphs(["   "])).toEqual([]);
  });
});

describe("dải Giải pháp — mờ dần khi thu về trái", () => {
  it("thẻ còn trong khung nhìn thì rõ nguyên", () => {
    expect(cardOpacity(0, 0)).toBe(1);
    expect(cardOpacity(2, 0)).toBe(1);
    expect(cardOpacity(3, 0)).toBe(1);
  });

  it("thẻ bị kéo ra khỏi mép trái thì mờ dần theo phần đã khuất", () => {
    const half = SOLUTION_CARD.width / 2;
    expect(cardOpacity(0, half)).toBeCloseTo(0.5, 2);
    // Khuat han thi mat hut, khong bao gio am.
    expect(cardOpacity(0, SOLUTION_CARD.width)).toBe(0);
    expect(cardOpacity(0, SOLUTION_CARD.width * 3)).toBe(0);
  });

  it("thẻ phía sau chỉ bắt đầu mờ khi tới lượt nó ra khỏi mép", () => {
    expect(cardOpacity(1, SOLUTION_PITCH)).toBe(1);
    expect(cardOpacity(1, SOLUTION_PITCH + SOLUTION_CARD.width / 2)).toBeCloseTo(0.5, 2);
  });

  it("mỗi nhịp đẩy dải đi đúng một thẻ", () => {
    expect(offsetAt(0)).toBe(0);
    expect(offsetAt(1)).toBe(SOLUTION_PITCH);
    expect(offsetAt(3)).toBe(3 * SOLUTION_PITCH);
  });

  it("sau mỗi nhịp, đúng một thẻ nữa mờ hẳn", () => {
    for (let step = 1; step <= SOLUTION_CARDS.length; step += 1) {
      const gone = repeatedCards().filter(
        (_, index) => cardOpacity(index, offsetAt(step)) === 0,
      ).length;
      expect(gone, `nhịp ${step}`).toBe(step);
    }
  });
});

describe("bốn ô Công nghệ trên trang chủ", () => {
  // Trang chu co HAI cum the noi len: bon tam muc "Trai nghiem" (cum
  // "home-trai-nghiem") va bon o muc "Cong nghe" (cum "home"). Khoi nay chi
  // noi ve cum thu hai.
  const boxes = getLiftCards("home").filter((card) => card.group === "home");

  it("trang chủ có đúng bốn ô", () => {
    expect(boxes).toHaveLength(4);
    expect(boxes.map((b) => b.title)).toEqual([
      "INNOVATION",
      "APPLICATIONS",
      "WARRANTY",
      "EXPERIENCE LAB",
    ]);
    expect(getLiftCards("cong-nghe")).toEqual([]);
  });

  it("bốn ô xếp ngang, không chồng lên nhau, nằm trong khung canvas", () => {
    const byX = [...boxes].sort((a, b) => a.x - b.x);
    for (const box of byX) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1440);
      expect(box.width).toBeGreaterThan(200);
      expect(box.height).toBeGreaterThan(200);
      // Bon o cung mot hang.
      expect(box.y).toBe(byX[0].y);
      expect(box.height).toBe(byX[0].height);
    }
    for (let i = 1; i < byX.length; i += 1) {
      expect(byX[i].x).toBeGreaterThanOrEqual(byX[i - 1].x + byX[i - 1].width);
    }
  });

  it("mỗi ô dẫn tới một trang có thật", () => {
    const routes = new Set([
      "/cong-nghe",
      ...getAllSubPages().map((p) => p.route),
    ]);
    for (const box of boxes) {
      expect(routes.has(box.href), `${box.title} -> ${box.href}`).toBe(true);
    }
  });
});

describe("slider ảnh vẽ chết trong thiết kế", () => {
  const sliders = [
    ...getPhotoSliders("home"),
    ...getPhotoSliders("dai-ly"),
    ...getPhotoSliders("nhan-su"),
  ];

  it("đúng những trang có mũi tên vẽ sẵn mới có slider", () => {
    expect(getPhotoSliders("home").map((s) => s.id)).toEqual(["cau-chuyen-khoi-nghiep"]);
    expect(getPhotoSliders("dai-ly").map((s) => s.id)).toEqual(["chan-dung-dai-ly"]);
    expect(getPhotoSliders("nhan-su").map((s) => s.id)).toEqual(["con-nguoi-tc"]);
    expect(getPhotoSliders("giai-phap")).toEqual([]);
  });

  it("mũi tên lùi chỉ có ở mục thiết kế thật sự vẽ hai mũi tên", () => {
    const withPrev = sliders.filter((s) => s.prev);
    expect(withPrev.map((s) => s.id)).toEqual(["con-nguoi-tc"]);
    // Mui ten lui nam ben TRAI khung anh, mui ten tien nam ben phai.
    for (const slider of withPrev) {
      expect(slider.prev!.x).toBeLessThan(slider.box.x);
      expect(slider.arrow.x).toBeGreaterThan(slider.box.x);
    }
  });

  it("chạy vòng ngược cũng không bao giờ hết", () => {
    expect(prevSlide(0, 4)).toBe(3);
    expect(prevSlide(3, 4)).toBe(2);
    expect(prevSlide(0, 0)).toBe(0);
  });

  it("phải có từ 2 ảnh trở lên thì mũi tên mới có nghĩa", () => {
    for (const slider of sliders) {
      expect(slider.slides.length, slider.label).toBeGreaterThanOrEqual(2);
      expect(new Set(slider.slides).size).toBe(slider.slides.length);
    }
  });

  it("khung ảnh nằm trong canvas, mũi tên bám sát mép phải của khung", () => {
    for (const { box, arrow } of sliders) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1440);
      expect(arrow.x + arrow.width).toBeLessThanOrEqual(1440);
      // Mui ten nam CANH tam anh: hoac de len mep, hoac tho ra ngoai mot doan
      // ngan. "Chân dung đại lý" cach mep 51px, "Con người TC" cach 109px.
      const overhang = arrow.x + arrow.width - (box.x + box.width);
      expect(overhang, "mũi tên phải bám cạnh tấm ảnh").toBeGreaterThan(-40);
      expect(overhang).toBeLessThan(160);
      // Theo chieu doc thi nam gon trong tam anh.
      expect(arrow.y).toBeGreaterThanOrEqual(box.y);
      expect(arrow.y + arrow.height).toBeLessThanOrEqual(box.y + box.height);
    }
  });

  it("chạy vòng: hết ảnh thì quay về ảnh đầu", () => {
    expect(nextSlide(0, 3)).toBe(1);
    expect(nextSlide(2, 3)).toBe(0);
    expect(nextSlide(0, 1)).toBe(0);
    expect(nextSlide(0, 0)).toBe(0);
  });
});

describe("hai thẻ Câu chuyện đồng hành (trang Đại lý)", () => {
  const cards = getLiftCards("dai-ly");

  it("trang Đại lý có đúng hai thẻ, đặt cạnh nhau cùng hàng", () => {
    expect(cards).toHaveLength(2);
    const [left, right] = [...cards].sort((a, b) => a.x - b.x);
    expect(left.y).toBe(right.y);
    expect(left.height).toBe(right.height);
    expect(left.width).toBe(right.width);
    expect(right.x).toBeGreaterThanOrEqual(left.x + left.width);
  });

  it("thẻ nằm trong canvas và dẫn tới trang có thật", () => {
    const routes = new Set(getAllSubPages().map((p) => p.route));
    for (const card of cards) {
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(1440);
      expect(routes.has(card.href), `${card.title} -> ${card.href}`).toBe(true);
    }
  });
});

describe("bốn tấm Trải nghiệm trên trang chủ", () => {
  // Cum nay nam SAT NHAU va chay het mep canvas, nen no PHONG TO khi ro chuot
  // thay vi nhac len — xem `grow` trong src/lib/lift-cards.ts.
  const panels = getLiftCards("home").filter(
    (card) => card.group === "home-trai-nghiem",
  );

  it("có đúng bốn tấm, tấm nào cũng dựng theo kiểu phóng to", () => {
    expect(panels).toHaveLength(4);
    for (const panel of panels) {
      expect(panel.grow, panel.id).toBe(true);
    }
  });

  it("xếp liền nhau, tấm cuối chạy hết mép canvas", () => {
    const byX = [...panels].sort((a, b) => a.x - b.x);
    for (let i = 1; i < byX.length; i += 1) {
      // Lien ke: mep phai tam truoc trung mep trai tam sau (sai so lam tron 1px).
      const gap = byX[i].x - (byX[i - 1].x + byX[i - 1].width);
      expect(Math.abs(gap), `khe giữa tấm ${i} và ${i + 1}`).toBeLessThanOrEqual(1);
    }
    const last = byX[byX.length - 1];
    expect(last.x + last.width).toBeGreaterThan(1435);
    expect(last.x + last.width).toBeLessThanOrEqual(1440);
  });

  it("mỗi tấm dẫn tới đúng mục con của Trải nghiệm", () => {
    expect(panels.map((p) => p.href)).toEqual([
      "/trai-nghiem/hanh-trinh",
      "/trai-nghiem/ban-sac-rieng",
      "/trai-nghiem/khoanh-khac",
      "/trai-nghiem/phong-cach-song",
    ]);
  });
});
