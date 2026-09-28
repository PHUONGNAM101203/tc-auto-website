import data from "@/data/asset-versions.json";

/**
 * Gan ma noi dung vao duong dan anh tinh.
 *
 * /brand duoc phuc vu voi `Cache-Control: immutable` va ten tep khong doi khi
 * ta sua anh — nguoi dung se giu ban cu mai. Them ?v=<hash> thi noi dung doi la
 * duong dan doi.
 */
const VERSIONS = (data as { versions: Record<string, string> }).versions;

export function asset(path: string): string {
  const version = VERSIONS[path];
  return version ? `${path}?v=${version}` : path;
}
