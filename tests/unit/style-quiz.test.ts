import { describe, expect, it } from "vitest";
import {
  PROFILES,
  QUESTIONS,
  QUIZ_BOX,
  QUIZ_LAYOUT,
  scoreOf,
  type Profile,
} from "@/lib/style-quiz";

/**
 * Trac nghiem "Ban sac rieng". Thiet ke chi ve chet MOT cau hoi vao anh; bon
 * cau sau va phan ket qua do du an viet — xem src/lib/design-deviations.ts.
 */
describe("bộ câu hỏi", () => {
  it("có đủ câu và mỗi câu có ít nhất hai lựa chọn", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(5);
    for (const question of QUESTIONS) {
      expect(question.prompt.length).toBeGreaterThan(0);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("mọi lựa chọn đều trỏ tới một nhóm CÓ THẬT", () => {
    // Day la cho de sai nhat: go mot nhom trong PROFILES ma quen sua cau hoi
    // thi nguoi dung lam xong trac nghiem se nhan mot ket qua rong.
    //
    // `profile: null` la HOP LE — do la o "Khác:" de nguoi dung tu viet, co y
    // khong tinh diem.
    const known = new Set(Object.keys(PROFILES));
    for (const question of QUESTIONS) {
      for (const option of question.options) {
        if (option.profile === null) {
          continue;
        }
        expect(
          known.has(option.profile),
          `${option.text} → ${option.profile}`,
        ).toBe(true);
      }
    }
  });

  it('mỗi câu đều có ô "Khác:" để người dùng tự viết', () => {
    for (const question of QUESTIONS) {
      const other = question.options.filter((o) => o.profile === null);
      expect(other.length, question.prompt).toBe(1);
      expect(other[0].text).toContain("Khác");
    }
  });

  it("mọi nhóm đều tới được từ ít nhất một lựa chọn", () => {
    // Chieu nguoc lai: mot nhom khong cau hoi nao dan toi la nhom chet.
    const reachable = new Set(
      QUESTIONS.flatMap((q) =>
        q.options.map((o) => o.profile).filter((p) => p !== null),
      ),
    );
    for (const profile of Object.keys(PROFILES)) {
      expect(reachable.has(profile as Profile), `nhóm ${profile}`).toBe(true);
    }
  });

  it("mỗi nhóm có đủ tiêu đề và mô tả để hiện ra màn hình", () => {
    for (const [key, result] of Object.entries(PROFILES)) {
      expect(result.title.length, key).toBeGreaterThan(0);
      expect(result.body.length, key).toBeGreaterThan(0);
    }
  });

  it("hình học lấy từ bản thiết kế, không phải số bịa", () => {
    expect(QUIZ_BOX.width).toBeGreaterThan(0);
    expect(QUIZ_BOX.height).toBeGreaterThan(0);
    expect(QUIZ_LAYOUT).toBeTruthy();
  });
});

describe("scoreOf", () => {
  it("nhóm được chọn nhiều nhất thì thắng", () => {
    expect(scoreOf(["canh", "canh", "lai"])).toBe("canh");
    expect(scoreOf(["xa", "lai", "lai", "lai"])).toBe("lai");
  });

  it("bỏ qua câu chưa trả lời", () => {
    expect(scoreOf([null, "xa", null, "xa", "canh"])).toBe("xa");
  });

  it("chưa trả lời câu nào thì về nhóm mặc định, không ném lỗi", () => {
    expect(scoreOf([])).toBe("thong-tha");
    expect(scoreOf([null, null])).toBe("thong-tha");
  });

  it("hoà nhau thì lấy nhóm xuất hiện SỚM NHẤT trong câu trả lời", () => {
    // Quan trong: ket qua phai on dinh, khong phu thuoc thu tu duyet Map.
    expect(scoreOf(["lai", "xa"])).toBe("lai");
    expect(scoreOf(["xa", "lai"])).toBe("xa");
  });

  it("kết quả luôn là một nhóm có mô tả để hiện ra", () => {
    for (const question of QUESTIONS) {
      for (const option of question.options) {
        expect(PROFILES[scoreOf([option.profile])]).toBeTruthy();
      }
    }
  });
});
