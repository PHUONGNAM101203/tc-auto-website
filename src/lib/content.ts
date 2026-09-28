import { cache } from "react";
import { CTA_LINK_MAP } from "./link-map";
import { getPageSpec } from "./pages";
import { isSupabaseConfigured } from "./supabase/env";
import { createSupabasePublicClient } from "./supabase/server";
import type { ItemSpec, PageSlug, PageSpec } from "./types";

interface OverrideRow {
  item_id: string;
  html: string | null;
  href: string | null;
  hidden: boolean | null;
}

/**
 * Doc cac ban ghi de noi dung cua 1 trang.
 * Tra ve Map rong (khong throw) khi chua cau hinh Supabase hoac chua chay migration —
 * site public luon render duoc tu page spec tinh.
 */
const loadOverrides = cache(
  async (slug: PageSlug): Promise<ReadonlyMap<string, OverrideRow>> => {
    if (!isSupabaseConfigured()) {
      return new Map();
    }

    try {
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from("page_items")
        .select("item_id, html, href, hidden")
        .eq("slug", slug);

      if (error) {
        console.error(`[content] Không đọc được page_items cho "${slug}":`, error.message);
        return new Map();
      }

      return new Map((data ?? []).map((row) => [row.item_id, row as OverrideRow]));
    } catch (error) {
      console.error(`[content] Lỗi khi tải override cho "${slug}":`, error);
      return new Map();
    }
  },
);

function applyOverride(item: ItemSpec, override: OverrideRow | undefined): ItemSpec | null {
  if (!override) {
    return item;
  }
  if (override.hidden) {
    return null;
  }

  const html = override.html?.trim() ? override.html : item.html;
  const href = override.href?.trim() ? override.href : item.href;

  if (html === item.html && href === item.href) {
    return item;
  }

  return {
    ...item,
    html,
    href,
    text: html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim(),
  };
}

/** Gan dich den cho cac nut CTA von la `javascript:void(0)` trong prototype. */
function applyCtaLink(item: ItemSpec): ItemSpec {
  const target = CTA_LINK_MAP[item.id];
  if (!target || item.href) {
    return item;
  }
  return { ...item, href: target };
}

/**
 * Page spec da ap dung noi dung admin chinh sua.
 * Toa do / style luon giu nguyen tu Figma — admin chi doi duoc text va link.
 */
export async function getPageContent(slug: PageSlug): Promise<PageSpec> {
  const base = getPageSpec(slug);
  const overrides = await loadOverrides(slug);

  return {
    ...base,
    items: base.items
      .map((item) => applyOverride(item, overrides.get(item.id)))
      .filter((item): item is ItemSpec => item !== null)
      // Ap sau override de admin van tu doi duoc dich den neu muon.
      .map(applyCtaLink),
  };
}
