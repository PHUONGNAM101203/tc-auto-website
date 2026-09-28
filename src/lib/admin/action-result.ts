/** Ket qua tra ve cho useActionState — dung chung cho moi form trong admin. */
export interface ActionResult {
  readonly ok: boolean;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}

export const IDLE: ActionResult = { ok: true, message: "" };

export function success(message: string): ActionResult {
  return { ok: true, message };
}

export function failure(
  message: string,
  fields?: Readonly<Record<string, string>>,
): ActionResult {
  return { ok: false, message, fields };
}

/**
 * `redirect()` va `notFound()` cua Next lam viec bang cach NEM RA mot loi dac
 * biet — do la co che dieu huong, khong phai su co. Bat lay no thi trang khong
 * chuyen di dau ca: bai da luu vao co so du lieu roi ma nguoi dung van ngoi lai
 * o bieu mau, tuong la hong.
 */
function isControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && /^NEXT_(REDIRECT|NOT_FOUND)/.test(digest);
}

/** Chuyen exception bat ky thanh thong bao an toan cho nguoi dung. */
export function fromError(error: unknown, fallback: string): ActionResult {
  if (isControlFlow(error)) {
    throw error;
  }
  console.error("[admin/action]", error);
  const message = error instanceof Error ? error.message : "";
  // Chi hien thi thong bao do ta tu nem ra; loi he thong thi dung ban fallback.
  const safe = message && message.length < 240 && !message.includes("\n") ? message : fallback;
  return failure(safe);
}
