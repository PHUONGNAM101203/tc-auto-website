import { describe, expect, it } from "vitest";
import { mergeByY } from "@/lib/mobile-order";

describe("trộn khối mobile theo độ cao", () => {
  it("dải nằm giữa thì phải CHEN vào giữa, không bị đẩy xuống cuối", () => {
    const chu = [
      { y: 100, item: "mở bài" },
      { y: 900, item: "kết bài" },
    ];
    const dai = [{ y: 500, item: "dải ảnh" }];
    expect(mergeByY(chu, dai)).toEqual(["mở bài", "dải ảnh", "kết bài"]);
  });

  it("dải nằm cuối thì vẫn ra cuối", () => {
    const chu = [
      { y: 100, item: "mở bài" },
      { y: 400, item: "thân bài" },
    ];
    expect(mergeByY(chu, [{ y: 900, item: "dải ảnh" }])).toEqual([
      "mở bài",
      "thân bài",
      "dải ảnh",
    ]);
  });

  it("dải nằm đầu thì ra trước cả chữ", () => {
    expect(mergeByY([{ y: 300, item: "chữ" }], [{ y: 50, item: "dải" }])).toEqual([
      "dải",
      "chữ",
    ]);
  });

  it("cùng độ cao thì GIỮ NGUYÊN thứ tự — câu văn không được đảo", () => {
    const cung = [
      { y: 200, item: "câu một" },
      { y: 200, item: "câu hai" },
      { y: 200, item: "câu ba" },
    ];
    expect(mergeByY(cung)).toEqual(["câu một", "câu hai", "câu ba"]);
  });

  it("trộn được nhiều hơn hai nhóm", () => {
    expect(
      mergeByY(
        [{ y: 10, item: "a" }],
        [{ y: 30, item: "c" }],
        [{ y: 20, item: "b" }],
      ),
    ).toEqual(["a", "b", "c"]);
  });

  it("nhóm rỗng không làm hỏng gì", () => {
    expect(mergeByY([], [{ y: 1, item: "x" }], [])).toEqual(["x"]);
    expect(mergeByY()).toEqual([]);
  });
});
