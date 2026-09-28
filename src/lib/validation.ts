import { z } from "zod";
import { LEAD_STATUSES, PAGE_SLUGS } from "./types";

/** So dien thoai Viet Nam: 0xxxxxxxxx / +84xxxxxxxxx, cho phep khoang trang, dau . - () */
const PHONE_PATTERN = /^(?:\+?84|0)(?:\d[\s.\-()]?){8,10}\d$/;

export const leadInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ và tên (tối thiểu 2 ký tự)")
    .max(120, "Họ và tên quá dài"),
  phone: z
    .string()
    .trim()
    .min(9, "Số điện thoại quá ngắn")
    .max(20, "Số điện thoại quá dài")
    .regex(PHONE_PATTERN, "Số điện thoại không hợp lệ"),
  message: z.string().trim().max(2000, "Nội dung quá dài").optional().default(""),
  sourcePage: z.string().trim().max(120).default("/"),
  /** Bay bot: bot thuong dien vao field an nay */
  honeypot: z.string().max(0, "Yêu cầu không hợp lệ").optional().default(""),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

export type LeadUpdate = z.infer<typeof leadUpdateSchema>;

export const itemOverrideSchema = z.object({
  slug: z.enum(PAGE_SLUGS),
  itemId: z.string().trim().min(1).max(64),
  html: z.string().max(5000).nullable(),
  href: z.string().trim().max(500).nullable(),
  hidden: z.boolean().default(false),
});

export type ItemOverrideInput = z.infer<typeof itemOverrideSchema>;

export const settingsSchema = z.object({
  siteTitle: z.string().trim().min(1).max(160),
  siteDescription: z.string().trim().max(400),
  contactPhone: z.string().trim().max(40),
  contactEmail: z.string().trim().email("Email không hợp lệ").or(z.literal("")),
  contactAddress: z.string().trim().max(300),
  motionEnabled: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const credentialsSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(200),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Chuyen loi zod thanh map field -> message dau tien.
 * Dung cho ca API response va form state.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in out)) {
      out[key] = issue.message;
    }
  }
  return out;
}
