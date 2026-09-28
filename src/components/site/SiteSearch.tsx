"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@/lib/search";

const DEBOUNCE_MS = 180;
const MIN_QUERY = 2;

interface SearchResult {
  readonly query: string;
  readonly hits: readonly SearchHit[];
  readonly failed: boolean;
}

/**
 * O tim kiem trong header. Giao dien o input giu nguyen thiet ke Figma (.search);
 * ket qua hien trong popover overlay ben duoi, khong day layout.
 *
 * Trang thai popover duoc SUY RA tu query chu khong luu rieng: goi setState ngay
 * trong than effect se gay cascading render va lam nhay ket qua cu khi go tiep.
 */
export function SiteSearch() {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLLabelElement>(null);

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const trimmed = query.trim();
  const active = trimmed.length >= MIN_QUERY;

  // Chi dung ket qua khop DUNG truy van hien tai — tranh hien ket qua cu.
  const fresh = result?.query === trimmed ? result : null;
  const hits = fresh?.hits ?? [];
  const open = active && !dismissed;

  useEffect(() => {
    if (!active) {
      return;
    }

    const controller = new AbortController();

    // setState nam trong callback bat dong bo, khong phai trong than effect.
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Tìm kiếm thất bại (${response.status})`);
        }
        const payload = (await response.json()) as { hits?: SearchHit[] };
        setResult({ query: trimmed, hits: payload.hits ?? [], failed: false });
        setCursor(-1);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("[search]", error);
        setResult({ query: trimmed, hits: [], failed: true });
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, active]);

  // Dong popover khi bam ra ngoai.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setDismissed(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const go = useCallback(
    (hit: SearchHit) => {
      setDismissed(true);
      setQuery("");
      setResult(null);
      // Trang chinh co id phan tu de nhay toi. Trang con la anh nen khong co
      // phan tu tuong ung — dung neo theo toa do y trong canvas (#y1234).
      const anchor = hit.itemId
        ? `#${hit.itemId}`
        : hit.y !== null
          ? `#y${Math.round(hit.y)}`
          : "";
      router.push(`${hit.route}${anchor}`);
    },
    [router],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setDismissed(true);
      return;
    }
    if (!open || hits.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((current) => (current + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((current) => (current <= 0 ? hits.length - 1 : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[cursor >= 0 ? cursor : 0]);
    }
  };

  return (
    <label className="search" ref={wrapRef}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </svg>
      <input
        type="search"
        placeholder="Nhập để tìm kiếm..."
        aria-label="Tìm kiếm trên toàn bộ website"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        role="combobox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setDismissed(false);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setDismissed(false)}
      />

      <div className={`tc-search-pop${open ? " is-on" : ""}`} id={listId} role="listbox">
        {hits.length > 0 ? (
          hits.map((hit, index) => (
            <button
              key={`${hit.slug}-${hit.itemId}`}
              type="button"
              className="tc-search-hit"
              role="option"
              aria-selected={index === cursor}
              onClick={() => go(hit)}
              onMouseEnter={() => setCursor(index)}
            >
              <span>{hit.pageTitle}</span>
              {hit.snippet}
            </button>
          ))
        ) : (
          <p className="tc-search-empty">
            {!fresh || loading
              ? "Đang tìm…"
              : fresh.failed
                ? "Không thực hiện được tìm kiếm. Vui lòng thử lại."
                : `Không tìm thấy kết quả cho “${trimmed}”.`}
          </p>
        )}
      </div>
    </label>
  );
}
