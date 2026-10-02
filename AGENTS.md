<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sơ đồ tri thức của dự án

`graphify-out/GRAPH_REPORT.md` là bản đồ mã nguồn: 1680 nút, 3437 cạnh, 143
cụm đã được đặt tên theo nghĩa ("Background Image Reconstruction", "Dynamic
Subpage Routing", "Solution Card Reordering"…). Dựng ngày 02/10/2026 từ commit
`fecab779`.

Hỏi nó trước khi đi đọc mò cả thư mục:

```
graphify explain "ScreenTabs.tsx"              # chính xác nhất
graphify path "ScreenTabs.tsx" "authored-pages.ts"   # lần theo quan hệ
graphify query "<câu hỏi tiếng Anh>"           # rộng nhất, nhiễu nhất
```

`query` khớp theo TỪ KHOÁ chứ không theo nghĩa, và mọi nhãn đều là tiếng Anh —
hỏi bằng tiếng Việt thì trả về nhiễu. Dùng `explain` khi đã biết tên.

Dựng lại sau khi sửa mã:

```
graphify update .          # không cần LLM, không tốn gì
graphify cluster-only .    # đặt lại tên cụm, cần đăng nhập Claude
```

Hai cái bẫy đã gặp:
1. **Lệnh `extract` không còn tồn tại** ở bản 0.9.53 — nay là `update`. Gọi
   `extract` thì tiến trình treo im lặng ở 0% CPU, không báo lỗi gì.
2. `cluster-only --backend=…` **bỏ qua tham số backend** nếu
   `graphify-out/.graphify_labels.json` đã có; phải xoá tệp đó trước, nếu
   không nhãn cụm cứ là tên tệp chứ không phải tên có nghĩa.
