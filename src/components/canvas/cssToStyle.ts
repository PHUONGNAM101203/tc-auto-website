import type { CSSProperties } from "react";

/**
 * Doi record CSS kebab-case tu page spec thanh style object cua React.
 * Custom property (--tri) duoc giu nguyen ten.
 */
export function cssToStyle(css: Readonly<Record<string, string>>): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(css)) {
    style[key.startsWith("--") ? key : toCamel(key)] = value;
  }
  return style as CSSProperties;
}

function toCamel(key: string): string {
  return key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}
