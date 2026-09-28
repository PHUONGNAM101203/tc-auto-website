"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/admin/action-result";
import { deleteLead, updateLead } from "@/lib/admin/actions";
import type { LeadRow } from "@/lib/admin/queries";
import { LEAD_STATUS_LABEL, LEAD_STATUSES, type LeadStatus } from "@/lib/types";
import { STATUS_HUE } from "./charts/tokens";
import { FormBanner } from "./FormBanner";
import { SubmitButton } from "./SubmitButton";
import { Field, formatDateTime, formatRelative, Select, TextArea } from "./ui";

export function LeadRowEditor({
  lead,
  canDelete,
}: {
  readonly lead: LeadRow;
  readonly canDelete: boolean;
}) {
  const [updateState, update] = useActionState(updateLead, IDLE);
  const [deleteState, remove] = useActionState(deleteLead, IDLE);
  const banner = updateState.message ? updateState : deleteState;

  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.02] open:bg-white/[0.04]">
      <summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_10rem_7rem_auto]">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ background: STATUS_HUE[lead.status] }}
        />

        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-white">{lead.name}</span>
          <a
            href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
            onClick={(event) => event.stopPropagation()}
            className="mt-0.5 block font-mono text-[11px] text-sky transition hover:text-white"
          >
            {lead.phone}
          </a>
        </span>

        <span className="hidden text-[11px] text-white/50 sm:block">
          {LEAD_STATUS_LABEL[lead.status]}
        </span>

        <span
          className="hidden text-[11px] text-white/35 sm:block"
          title={formatDateTime(lead.createdAt)}
        >
          {formatRelative(lead.createdAt)}
        </span>

        <span className="shrink-0 text-white/30 transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className="space-y-4 border-t border-white/8 px-4 py-4">
        <dl className="grid gap-3 text-[11px] sm:grid-cols-3">
          <div>
            <dt className="text-white/40">Thời điểm gửi</dt>
            <dd className="mt-0.5 text-white/85">{formatDateTime(lead.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-white/40">Trang nguồn</dt>
            <dd className="mt-0.5 font-mono text-white/85">{lead.sourcePage}</dd>
          </div>
          <div>
            <dt className="text-white/40">Mã</dt>
            <dd className="mt-0.5 font-mono text-white/45">{lead.id.slice(0, 8)}</dd>
          </div>
        </dl>

        {lead.message && (
          <div>
            <p className="text-[11px] text-white/40">Nội dung khách để lại</p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-navy/60 px-3 py-2 text-xs leading-relaxed text-white/80">
              {lead.message}
            </p>
          </div>
        )}

        <form action={update} className="space-y-3">
          <input type="hidden" name="id" value={lead.id} />

          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <Field label="Trạng thái" htmlFor={`status-${lead.id}`}>
              <Select id={`status-${lead.id}`} name="status" defaultValue={lead.status}>
                {LEAD_STATUSES.map((status: LeadStatus) => (
                  <option key={status} value={status}>
                    {LEAD_STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Ghi chú nội bộ" htmlFor={`note-${lead.id}`}>
              <TextArea
                id={`note-${lead.id}`}
                name="note"
                defaultValue={lead.note ?? ""}
                rows={2}
                maxLength={2000}
                placeholder="Đã gọi lúc 14h, khách hẹn gọi lại thứ 5…"
              />
            </Field>
          </div>

          <SubmitButton>Cập nhật</SubmitButton>
        </form>

        {canDelete && (
          <form action={remove} className="border-t border-white/8 pt-4">
            <input type="hidden" name="id" value={lead.id} />
            <SubmitButton
              variant="danger"
              pendingLabel="Đang xoá…"
              confirm={`Xoá vĩnh viễn lead "${lead.name}"? Không thể hoàn tác.`}
            >
              Xoá lead
            </SubmitButton>
          </form>
        )}

        <FormBanner result={banner} />
      </div>
    </details>
  );
}
