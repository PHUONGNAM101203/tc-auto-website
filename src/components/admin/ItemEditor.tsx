"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/admin/action-result";
import { resetPageItem, savePageItem } from "@/lib/admin/actions";
import type { ItemSpec, PageSlug } from "@/lib/types";
import { FormBanner } from "./FormBanner";
import { SubmitButton } from "./SubmitButton";
import { Badge, Field, TextArea, TextInput } from "./ui";

interface ItemEditorProps {
  readonly slug: PageSlug;
  readonly item: ItemSpec;
  /** Ban ghi de hien tai (neu co) — null nghia la dang dung nguyen ban Figma. */
  readonly override: {
    readonly html: string | null;
    readonly href: string | null;
    readonly hidden: boolean;
  } | null;
}

/** Nhan than thien cho class Figma. */
const KIND_LABEL: Readonly<Record<string, string>> = {
  herot: "Tiêu đề hero",
  slogan: "Slogan",
  lbl: "Nhãn mục",
  h: "Tiêu đề",
  hi: "Tiêu đề in nghiêng",
  p: "Đoạn văn",
  pi: "Đoạn văn in nghiêng",
  btn: "Nút",
  raw: "Khối tuỳ biến",
};

function kindOf(classes: readonly string[]): string {
  for (const name of classes) {
    if (name in KIND_LABEL) {
      return KIND_LABEL[name];
    }
  }
  return "Phần tử";
}

export function ItemEditor({ slug, item, override }: ItemEditorProps) {
  const [saveState, save] = useActionState(savePageItem, IDLE);
  const [resetState, reset] = useActionState(resetPageItem, IDLE);

  const currentHtml = override?.html ?? item.html;
  const currentHref = override?.href ?? item.href ?? "";
  const isEdited = override !== null;
  const banner = saveState.message ? saveState : resetState;

  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.02] open:bg-white/[0.04]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">
              {kindOf(item.classes)}
            </span>
            {isEdited && <Badge tone="info">Đã sửa</Badge>}
            {override?.hidden && <Badge tone="warn">Đang ẩn</Badge>}
          </span>
          <span className="mt-0.5 block truncate text-xs text-white/80">
            {item.text || <em className="text-white/35">(không có chữ)</em>}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/25">
          {Math.round(item.x)},{Math.round(item.y)}
        </span>
        <span className="shrink-0 text-white/30 transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className="space-y-4 border-t border-white/8 px-4 py-4">
        <form action={save} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="itemId" value={item.id} />

          <Field
            label="Nội dung"
            htmlFor={`html-${item.id}`}
            error={saveState.fields?.html}
            hint="Cho phép <br>, <span class=…>, <b>, <i>. Thẻ và style khác sẽ bị loại bỏ."
          >
            <TextArea
              id={`html-${item.id}`}
              name="html"
              defaultValue={currentHtml}
              rows={Math.min(8, Math.max(2, Math.ceil(currentHtml.length / 70)))}
              maxLength={5000}
              aria-invalid={Boolean(saveState.fields?.html)}
            />
          </Field>

          {item.tag === "a" && (
            <Field
              label="Liên kết"
              htmlFor={`href-${item.id}`}
              error={saveState.fields?.href}
              hint="Bắt đầu bằng / (nội bộ), https://, tel: hoặc mailto:"
            >
              <TextInput
                id={`href-${item.id}`}
                name="href"
                defaultValue={currentHref}
                placeholder="/giai-phap"
                aria-invalid={Boolean(saveState.fields?.href)}
              />
            </Field>
          )}

          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              name="hidden"
              defaultChecked={override?.hidden ?? false}
              className="size-3.5 rounded border-white/25 bg-navy accent-brand"
            />
            Ẩn phần tử này khỏi website
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton>Lưu</SubmitButton>
            {isEdited && (
              <span className="text-[11px] text-white/35">
                Bỏ trống thay đổi rồi lưu sẽ tự trả về bản Figma
              </span>
            )}
          </div>
        </form>

        {isEdited && (
          <div className="space-y-2 border-t border-white/8 pt-4">
            <p className="text-[11px] font-medium text-white/50">Bản gốc từ Figma</p>
            <pre className="overflow-x-auto rounded-lg bg-navy/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/60">
              {item.html}
            </pre>
            <form action={reset}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="itemId" value={item.id} />
              <SubmitButton
                variant="danger"
                pendingLabel="Đang khôi phục…"
                confirm="Khôi phục nội dung gốc từ Figma cho phần tử này?"
              >
                Khôi phục bản gốc
              </SubmitButton>
            </form>
          </div>
        )}

        <FormBanner result={banner} />
      </div>
    </details>
  );
}
