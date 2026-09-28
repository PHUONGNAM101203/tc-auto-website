import { z } from "zod";
import { PAGE_SLUGS } from "./types";

/** Xac thuc spec trang con ngay khi import — sinh sai thi build do, khong render lech. */

const sliceSchema = z.object({
  src: z.string().startsWith("/slices/sub/"),
  /** Cac ban do phan giai — trinh duyet chon theo devicePixelRatio. */
  srcSet: z
    .array(z.object({ src: z.string().startsWith("/slices/sub/"), scale: z.number().int().positive() }))
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

const crumbSchema = z.object({
  label: z.string().min(1),
  href: z.string().startsWith("/"),
});

export const subPageSpecSchema = z.object({
  slug: z.string().min(1),
  route: z.string().startsWith("/"),
  title: z.string().min(1),
  section: z.enum(PAGE_SLUGS),
  isArticle: z.boolean(),
  canvasWidth: z.literal(1440),
  height: z.number().positive(),
  slices: z.array(sliceSchema).min(1),
  nav: z.array(navSchema).length(5),
  contactForm: z.object({ y: z.number().positive() }),
  breadcrumb: z.array(crumbSchema).min(1),
  sourceFile: z.string().min(1),
});

export type SubPageSpec = z.infer<typeof subPageSpecSchema>;

export function parseSubPageSpec(raw: unknown, label: string): SubPageSpec {
  const result = subPageSpecSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(
      `Spec trang con "${label}" không hợp lệ tại ${first.path.join(".") || "<root>"}: ` +
        `${first.message}. Chạy lại: npm run parse:subpages`,
    );
  }
  return result.data;
}
