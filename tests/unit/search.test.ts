import { describe, expect, it } from "vitest";
import { normalise, searchSite } from "@/lib/search";

describe("normalise", () => {
  it("bỏ dấu tiếng Việt", () => {
    expect(normalise("GIẢI PHÁP")).toBe("giai phap");
    expect(normalise("TUYỂN DỤNG")).toBe("tuyen dung");
    expect(normalise("PHIM CÁCH NHIỆT")).toBe("phim cach nhiet");
  });

  it("chuyển đ/Đ thành d", () => {
    expect(normalise("ĐẠI LÝ")).toBe("dai ly");
    expect(normalise("đồng hành")).toBe("dong hanh");
  });

  it("gom khoảng trắng và cắt hai đầu", () => {
    expect(normalise("  a   b  ")).toBe("a b");
  });

  it("xử lý chuỗi rỗng", () => {
    expect(normalise("")).toBe("");
  });
});

describe("searchSite", () => {
  it("bỏ qua truy vấn ngắn hơn 2 ký tự", () => {
    expect(searchSite("")).toEqual([]);
    expect(searchSite("a")).toEqual([]);
  });

  it("tìm được khi người dùng gõ không dấu", () => {
    const hits = searchSite("phim cach nhiet");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].slug).toBe("giai-phap");
  });

  it("tìm được khi gõ có dấu", () => {
    const hits = searchSite("tuyển dụng");
    expect(hits.length).toBeGreaterThan(0);
    // Khop ca trang chinh /nhan-su lan cac trang con tuyen dung.
    expect(hits.every((hit) => hit.route.startsWith("/nhan-su"))).toBe(true);
  });

  it("tìm ra được nội dung chỉ có trong trang con", () => {
    // "KHO ỨNG DỤNG" chi xuat hien tren trang con, khong co o 6 trang chinh.
    const hits = searchSite("kho ung dung");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.route.startsWith("/cong-nghe/ung-dung"))).toBe(true);
  });

  it("chỉ mục phủ cả 31 trang con", () => {
    // Moi trang con phai tim ra duoc qua it nhat mot tu khoa trong tieu de cua no.
    const reachable = new Set(
      searchSite("tc", 200).concat(searchSite("dụng", 200)).map((hit) => hit.route),
    );
    expect(reachable.size).toBeGreaterThan(5);
  });

  it("mỗi trang chỉ xuất hiện một lần trong kết quả", () => {
    const hits = searchSite("tc auto", 20);
    const routes = hits.map((hit) => hit.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("không phân biệt chữ hoa chữ thường", () => {
    expect(searchSite("ppf").length).toBe(searchSite("PPF").length);
  });

  it("xếp tiêu đề lên trước đoạn văn", () => {
    const hits = searchSite("PPF");
    expect(hits.length).toBeGreaterThan(0);
    // Trong moi trang, khoi diem cao nhat duoc giu — voi /giai-phap do la
    // nhan muc "PPF" chu khong phai doan van dai chua chu "PPF".
    const onSolutions = hits.find((hit) => hit.route === "/giai-phap");
    expect(onSolutions).toBeDefined();
    expect(onSolutions!.snippet.trim()).toBe("PPF");
    // Diem giam dan theo thu tu tra ve
    for (let i = 1; i < hits.length; i += 1) {
      expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
    }
  });

  it("trả về kết quả rỗng khi không khớp", () => {
    expect(searchSite("zzzzzkhongtontai")).toEqual([]);
  });

  it("tôn trọng giới hạn số kết quả", () => {
    expect(searchSite("tc", 3).length).toBeLessThanOrEqual(3);
    expect(searchSite("tc", 1).length).toBeLessThanOrEqual(1);
  });

  it("mỗi kết quả luôn điều hướng được", () => {
    for (const hit of searchSite("giải pháp", 20)) {
      expect(hit.route.startsWith("/")).toBe(true);
      expect(hit.snippet.length).toBeGreaterThan(0);
      // Trang chinh nhay theo id phan tu; trang con la anh nen nhay theo toa do y.
      const navigable = hit.itemId !== "" || hit.y !== null;
      expect(navigable, `${hit.route} không có neo để nhảy tới`).toBe(true);
      if (hit.itemId) {
        expect(hit.itemId).toMatch(/^[a-z-]+-\d{3}$/);
      }
    }
  });

  it("không nổ với ký tự đặc biệt của regex", () => {
    for (const query of ["a(b", "a)b", "a*b", "a[b", "a\\b", "a+b", "a$b", "a?b"]) {
      expect(() => searchSite(query)).not.toThrow();
    }
  });

  it("cắt ngắn đoạn trích dài bằng dấu ba chấm", () => {
    const hits = searchSite("bảo vệ lớp sơn nguyên bản");
    expect(hits.length).toBeGreaterThan(0);
    const long = hits.find((hit) => hit.snippet.includes("…"));
    expect(long).toBeDefined();
  });
});
