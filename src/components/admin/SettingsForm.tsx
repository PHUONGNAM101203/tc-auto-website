"use client";

import { useActionState } from "react";
import { IDLE } from "@/lib/admin/action-result";
import { saveSettings } from "@/lib/admin/actions";
import type { SettingsRow } from "@/lib/admin/queries";
import { FormBanner } from "./FormBanner";
import { SubmitButton } from "./SubmitButton";
import { Field, TextArea, TextInput } from "./ui";

export function SettingsForm({ settings }: { readonly settings: SettingsRow }) {
  const [state, save] = useActionState(saveSettings, IDLE);

  return (
    <form action={save} className="max-w-xl space-y-5">
      <Field label="Tên website" htmlFor="siteTitle" error={state.fields?.siteTitle}>
        <TextInput
          id="siteTitle"
          name="siteTitle"
          defaultValue={settings.siteTitle}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fields?.siteTitle)}
        />
      </Field>

      <Field
        label="Mô tả ngắn"
        htmlFor="siteDescription"
        error={state.fields?.siteDescription}
        hint="Dùng cho thẻ meta description và khi chia sẻ link."
      >
        <TextArea
          id="siteDescription"
          name="siteDescription"
          defaultValue={settings.siteDescription}
          rows={3}
          maxLength={400}
          aria-invalid={Boolean(state.fields?.siteDescription)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hotline" htmlFor="contactPhone" error={state.fields?.contactPhone}>
          <TextInput
            id="contactPhone"
            name="contactPhone"
            defaultValue={settings.contactPhone}
            maxLength={40}
            placeholder="0909 123 456"
            aria-invalid={Boolean(state.fields?.contactPhone)}
          />
        </Field>

        <Field label="Email liên hệ" htmlFor="contactEmail" error={state.fields?.contactEmail}>
          <TextInput
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={settings.contactEmail}
            placeholder="lienhe@tcauto.vn"
            aria-invalid={Boolean(state.fields?.contactEmail)}
          />
        </Field>
      </div>

      <Field label="Địa chỉ" htmlFor="contactAddress" error={state.fields?.contactAddress}>
        <TextArea
          id="contactAddress"
          name="contactAddress"
          defaultValue={settings.contactAddress}
          rows={2}
          maxLength={300}
          aria-invalid={Boolean(state.fields?.contactAddress)}
        />
      </Field>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-white/70">
        <input
          type="checkbox"
          name="motionEnabled"
          defaultChecked={settings.motionEnabled}
          className="mt-0.5 size-3.5 shrink-0 rounded border-white/25 bg-navy accent-brand"
        />
        <span>
          Bật hiệu ứng chuyển động trên website
          <span className="mt-0.5 block text-white/35">
            Tắt sẽ hiện mọi nội dung ở trạng thái cuối ngay lập tức. Trình duyệt của
            khách đã bật “giảm chuyển động” thì luôn được tôn trọng bất kể tuỳ chọn này.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-4">
        <SubmitButton>Lưu cài đặt</SubmitButton>
      </div>

      <FormBanner result={state} />
    </form>
  );
}
