import { z } from "zod";
import { PAGE_SLUGS } from "./types";

/**
 * Xac thuc page spec ngay khi import.
 * JSON do tools/parse-prototype.py sinh ra — schema nay bat loi ngay tai build
 * neu parser sinh sai cau truc, thay vi de site render lech.
 */

const sliceSchema = z.object({
  src: z.string().startsWith("/slices/"),
  /** Cac ban do phan giai — trinh duyet chon theo devicePixelRatio. */
  srcSet: z
    .array(z.object({ src: z.string().startsWith("/slices/"), scale: z.number().int().positive() }))
    .min(1),
  y: z.number().nonnegative(),
  displayHeight: z.number().positive(),
  intrinsicWidth: z.number().int().positive(),
  intrinsicHeight: z.number().int().positive(),
  bytes: z.number().int().positive(),
  bytesByScale: z.record(z.string(), z.number().int().positive()),
});

const navSchema = z.object({
  label: z.string().min(1),
  href: z.string().startsWith("/"),
  x: z.number(),
  active: z.boolean(),
});

const itemSchema = z.object({
  id: z.string().min(1),
  tag: z.enum(["div", "a"]),
  classes: z.array(z.string()),
  x: z.number(),
  y: z.number(),
  w: z.number().nullable(),
  h: z.number().nullable(),
  css: z.record(z.string(), z.string()),
  href: z.string().nullable(),
  html: z.string(),
  text: z.string(),
});

export const pageSpecSchema = z.object({
  slug: z.enum(PAGE_SLUGS),
  route: z.string().startsWith("/"),
  title: z.string().min(1),
  canvasWidth: z.literal(1440),
  height: z.number().positive(),
  slices: z.array(sliceSchema).min(1),
  nav: z.array(navSchema).min(1),
  items: z.array(itemSchema).min(1),
  contactForm: z.object({ y: z.number().positive() }).nullable(),
});

export type ValidatedPageSpec = z.infer<typeof pageSpecSchema>;

/** Parse + bao loi ro rang kem ten trang neu that bai. */
export function parsePageSpec(raw: unknown, label: string): ValidatedPageSpec {
  const result = pageSpecSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(
      `Page spec "${label}" không hợp lệ tại ${first.path.join(".") || "<root>"}: ${first.message}. ` +
        `Chạy lại: python3 tools/parse-prototype.py`,
    );
  }
  return result.data;
}
