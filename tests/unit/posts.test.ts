import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Bai viet do admin soan.
 *
 * Diem quan trong nhat o day KHONG phai duong "co du lieu" ma la duong HONG:
 * site cong khai co 47 trang tinh va phai render duoc ca khi chua cau hinh
 * Supabase hoac khi Supabase tra ve loi. Ham nao cung phai nuot loi va tra ve
 * rong thay vi nem len — nem mot cai la ca trang 500.
 */

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: vi.fn(() => false),
  isSupabaseAdminConfigured: vi.fn(() => false),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabasePublicClient: vi.fn(),
}));

const env = await import("@/lib/supabase/env");
const server = await import("@/lib/supabase/server");
const { listPublishedPosts, getPublishedPost, postParagraphs, formatPostDate } =
  await import("@/lib/posts");

/** Dung mot builder gia tra ve `result` o buoc cuoi cua chuoi goi. */
function fakeClient(result: unknown, { single = false } = {}) {
  const builder: Record<string, unknown> = {};
  for (const name of ["from", "select", "eq", "order"]) {
    builder[name] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(async () => result);
  // Chuoi khong ket thuc bang maybeSingle thi duoc `await` thang.
  if (!single) {
    builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  }
  return builder;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(env.isSupabaseConfigured).mockReturnValue(false);
});

describe("listPublishedPosts", () => {
  it("chưa cấu hình Supabase thì trả mảng rỗng, không gọi mạng", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(false);
    await expect(listPublishedPosts()).resolves.toEqual([]);
    expect(server.createSupabasePublicClient).not.toHaveBeenCalled();
  });

  it("đổi tên cột snake_case sang camelCase", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(server.createSupabasePublicClient).mockReturnValue(
      fakeClient({
        data: [
          {
            slug: "a",
            title: "Bài A",
            excerpt: null,
            body: "Thân bài",
            cover_url: "/a.webp",
            section: "cong-nghe",
            published_at: "2026-08-20",
            source_url: null,
          },
        ],
        error: null,
      }) as never,
    );
    const posts = await listPublishedPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].coverUrl).toBe("/a.webp");
    expect(posts[0].publishedAt).toBe("2026-08-20");
    expect(posts[0].sourceUrl).toBeNull();
  });

  it("lọc theo mục khi được truyền", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    const client = fakeClient({ data: [], error: null });
    vi.mocked(server.createSupabasePublicClient).mockReturnValue(client as never);
    await listPublishedPosts("nhan-su");
    const calls = vi.mocked(client.eq as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toContainEqual(["section", "nhan-su"]);
  });

  it("Supabase báo lỗi thì trả rỗng chứ KHÔNG ném lên", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(server.createSupabasePublicClient).mockReturnValue(
      fakeClient({ data: null, error: { message: "hỏng" } }) as never,
    );
    await expect(listPublishedPosts()).resolves.toEqual([]);
  });

  it("client ném ngoại lệ thì cũng trả rỗng", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(server.createSupabasePublicClient).mockImplementation(() => {
      throw new Error("mất mạng");
    });
    await expect(listPublishedPosts()).resolves.toEqual([]);
  });
});

describe("getPublishedPost", () => {
  it("chưa cấu hình thì trả null", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(false);
    await expect(getPublishedPost("a")).resolves.toBeNull();
  });

  it("không tìm thấy bài thì trả null", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(server.createSupabasePublicClient).mockReturnValue(
      fakeClient({ data: null, error: null }, { single: true }) as never,
    );
    await expect(getPublishedPost("a")).resolves.toBeNull();
  });

  it("có bài thì trả về đã đổi tên cột", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(server.createSupabasePublicClient).mockReturnValue(
      fakeClient(
        {
          data: {
            slug: "b",
            title: "Bài B",
            excerpt: "tóm tắt",
            body: "thân",
            cover_url: null,
            section: null,
            published_at: null,
            source_url: "https://vd.vn",
          },
          error: null,
        },
        { single: true },
      ) as never,
    );
    const post = await getPublishedPost("b");
    expect(post?.title).toBe("Bài B");
    expect(post?.sourceUrl).toBe("https://vd.vn");
  });

  it("lỗi hay ngoại lệ đều trả null", async () => {
    vi.mocked(env.isSupabaseConfigured).mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(server.createSupabasePublicClient).mockReturnValue(
      fakeClient({ data: null, error: { message: "hỏng" } }, { single: true }) as never,
    );
    await expect(getPublishedPost("b")).resolves.toBeNull();

    vi.mocked(server.createSupabasePublicClient).mockImplementation(() => {
      throw new Error("mất mạng");
    });
    await expect(getPublishedPost("b")).resolves.toBeNull();
  });
});

describe("postParagraphs", () => {
  it("tách đoạn theo dòng trống, nối lại các dòng trong cùng đoạn", () => {
    expect(postParagraphs("Câu một.\nCâu hai.\n\nĐoạn sau.")).toEqual([
      "Câu một. Câu hai.",
      "Đoạn sau.",
    ]);
  });

  it("bỏ đoạn rỗng và khoảng trắng thừa", () => {
    expect(postParagraphs("\n\n  \n\nMột đoạn\n\n\n\n")).toEqual(["Một đoạn"]);
    expect(postParagraphs("")).toEqual([]);
  });
});

describe("formatPostDate", () => {
  it("định dạng kiểu Việt Nam", () => {
    expect(formatPostDate("2026-08-20T00:00:00Z")).toBe("Ngày 20.8.2026");
  });

  it("thiếu ngày hoặc ngày hỏng thì trả chuỗi rỗng", () => {
    expect(formatPostDate(null)).toBe("");
    expect(formatPostDate("không phải ngày")).toBe("");
  });
});
