"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/admin/action-result";
import { deleteMedia } from "@/lib/admin/actions";
import type { MediaRow } from "@/lib/admin/queries";
import { FormBanner } from "./FormBanner";
import { SubmitButton } from "./SubmitButton";
import { formatBytes, formatRelative } from "./ui";

export function MediaCard({
  item,
  canDelete,
}: {
  readonly item: MediaRow;
  readonly canDelete: boolean;
}) {
  const [state, remove] = useActionState(deleteMedia, IDLE);
  const isImage = item.mimeType.startsWith("image/");

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="grid aspect-4/3 place-items-center overflow-hidden bg-navy/60">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- anh tu Supabase Storage, khong qua image optimizer
          <img
            src={item.publicUrl}
            alt={item.altText ?? item.name}
            loading="lazy"
            decoding="async"
            className="size-full object-contain"
          />
        ) : (
          <video
            src={item.publicUrl}
            controls
            preload="metadata"
            className="size-full object-contain"
          />
        )}
      </div>

      <figcaption className="space-y-2 p-3">
        <p className="truncate text-[11px] font-medium text-white/85" title={item.name}>
          {item.name}
        </p>
        <p className="text-[10px] tabular-nums text-white/35">
          {formatBytes(item.bytes)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""} ·{" "}
          {formatRelative(item.createdAt)}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(item.publicUrl)}
            className="text-[11px] text-sky transition hover:text-white"
          >
            Copy URL
          </button>
          <a
            href={item.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-white/40 transition hover:text-white"
          >
            Mở ↗
          </a>
        </div>

        {canDelete && (
          <form action={remove}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="path" value={item.path} />
            <SubmitButton
              variant="danger"
              pendingLabel="Đang xoá…"
              confirm={`Xoá vĩnh viễn "${item.name}"? Không thể hoàn tác.`}
            >
              Xoá
            </SubmitButton>
          </form>
        )}

        <FormBanner result={state} />
      </figcaption>
    </figure>
  );
}
