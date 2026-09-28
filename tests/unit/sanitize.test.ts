import { describe, expect, it } from "vitest";
import { sanitizeInlineHtml, splitHeadingLines } from "@/lib/sanitize";

describe("sanitizeInlineHtml", () => {
  it("giữ nguyên văn bản thuần", () => {
    expect(sanitizeInlineHtml("THẾ GIỚI CỦA TC")).toBe("THẾ GIỚI CỦA TC");
  });

  it("giữ các thẻ trang trí Figma thực dùng", () => {
    const input = 'DRIVE · <span class="c-blue">EXPERIENCE</span> · <span class="c-red">ELEVATE</span>';
    expect(sanitizeInlineHtml(input)).toBe(input);
  });

  it("giữ <br> và chuẩn hoá thành dạng không tự đóng", () => {
    expect(sanitizeInlineHtml("A<br/>B<br />C<br>D")).toBe("A<br>B<br>C<br>D");
  });

  it("giữ style typography nằm trong allowlist", () => {
    const out = sanitizeInlineHtml(
      '<div class="ub800" style="font-size:28px;line-height:38px;color:#fff">3M</div>',
    );
    expect(out).toContain('class="ub800"');
    expect(out).toContain("font-size:28px");
    expect(out).toContain("line-height:38px");
    expect(out).toContain("color:#fff");
  });

  it("loại thuộc tính style ngoài allowlist", () => {
    const out = sanitizeInlineHtml(
      '<span style="font-size:20px;background:red;position:fixed;top:0">x</span>',
    );
    expect(out).toContain("font-size:20px");
    expect(out).not.toContain("background");
    expect(out).not.toContain("position");
    expect(out).not.toContain("top");
  });

  it("loại giá trị style tải tài nguyên ngoài", () => {
    for (const value of [
      'font-family:url(http://evil.test/x)',
      "color:expression(alert(1))",
      "font-family:javascript:alert(1)",
      "color:data:text/html;base64,AAAA",
    ]) {
      expect(sanitizeInlineHtml(`<span style="${value}">x</span>`)).toBe("<span>x</span>");
    }
  });

  it("xoá script cùng toàn bộ nội dung bên trong", () => {
    expect(sanitizeInlineHtml('A<script>alert("x")</script>B')).toBe("AB");
    expect(sanitizeInlineHtml("A<style>body{display:none}</style>B")).toBe("AB");
    expect(sanitizeInlineHtml("A<iframe src=x></iframe>B")).toBe("AB");
  });

  it("xoá script chưa đóng thẻ", () => {
    expect(sanitizeInlineHtml("A<script>alert(1)")).toBe("A");
  });

  it("loại thẻ ngoài allowlist nhưng giữ nội dung", () => {
    expect(sanitizeInlineHtml("<h1>Tiêu đề</h1>")).toBe("Tiêu đề");
    expect(sanitizeInlineHtml('<a href="http://evil.test">link</a>')).toBe("link");
    expect(sanitizeInlineHtml('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("loại handler sự kiện trên thẻ được phép", () => {
    const out = sanitizeInlineHtml('<span onclick="alert(1)" class="c-red">x</span>');
    expect(out).toBe('<span class="c-red">x</span>');
    expect(out).not.toContain("onclick");
  });

  it("escape ký tự HTML trong văn bản", () => {
    expect(sanitizeInlineHtml("5 < 10 & 10 > 5")).toBe("5 &lt; 10 &amp; 10 &gt; 5");
  });

  it("KHÔNG escape lại entity đã hợp lệ", () => {
    expect(sanitizeInlineHtml("NGHIÊN CỨU &amp; PHÁT TRIỂN")).toBe(
      "NGHIÊN CỨU &amp; PHÁT TRIỂN",
    );
    expect(sanitizeInlineHtml("&#39;a&#x2F;b&nbsp;c")).toBe("&#39;a&#x2F;b&nbsp;c");
  });

  it("đóng thẻ còn mở", () => {
    expect(sanitizeInlineHtml('<span class="c-red">chưa đóng')).toBe(
      '<span class="c-red">chưa đóng</span>',
    );
  });

  it("xử lý thẻ đóng lồng sai thứ tự mà không rò rỉ", () => {
    const out = sanitizeInlineHtml("<b><i>x</b></i>");
    expect(out).toBe("<b><i>x</i></b>");
  });

  it("bỏ class có ký tự lạ", () => {
    expect(sanitizeInlineHtml('<span class="a\\"onload=x">y</span>')).toBe("<span>y</span>");
  });

  it("trả về chuỗi rỗng cho đầu vào rỗng", () => {
    expect(sanitizeInlineHtml("")).toBe("");
  });

  it("không bao giờ để lọt dấu < mở thẻ mới", () => {
    for (const payload of [
      '"><script>alert(1)</script>',
      "<<script>script>alert(1)<</script>/script>",
      '<span class="x"><script>alert(1)</script></span>',
    ]) {
      const out = sanitizeInlineHtml(payload);
      expect(out.toLowerCase()).not.toContain("<script");
      expect(out.toLowerCase()).not.toContain("javascript:");
    }
  });
});

describe("splitHeadingLines", () => {
  it("tách theo <br> và bỏ dòng rỗng", () => {
    expect(splitHeadingLines("TỪNG KHOẢNH<br>KHẮC, KIẾN TẠO<br>HÀNH TRÌNH.")).toEqual([
      "TỪNG KHOẢNH",
      "KHẮC, KIẾN TẠO",
      "HÀNH TRÌNH.",
    ]);
  });

  it("trả về một dòng khi không có <br>", () => {
    expect(splitHeadingLines("THẾ GIỚI CỦA TC")).toEqual(["THẾ GIỚI CỦA TC"]);
  });

  it("giữ span màu trong từng dòng", () => {
    expect(splitHeadingLines('TC MANG ĐẾN <span class="c-red">GIẢI PHÁP</span><br>NÂNG TẦM.')).toEqual(
      ['TC MANG ĐẾN <span class="c-red">GIẢI PHÁP</span>', "NÂNG TẦM."],
    );
  });

  it("trả về mảng rỗng khi không còn nội dung", () => {
    expect(splitHeadingLines("<br><br>")).toEqual([]);
  });
});
