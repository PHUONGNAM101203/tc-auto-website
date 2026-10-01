"use client";

import Link from "next/link";
import { useState } from "react";
import type { TreeNode } from "@/lib/mobile-tree";

/**
 * Muc luc dang cay cho dien thoai.
 *
 * Moi hang la MOT the <a> dan thang toi trang. Hang nao con trang con thi co
 * them MOT nut mui ten rieng ben phai: bam vao no thi mo nhanh con ngay duoi,
 * khong roi trang. Hai vung cham tach han nhau — gop lam mot thi nguoi dung
 * dinh xem muc cha se bi mo ra thay vi di toi noi.
 */
export function MobileTree({
  nodes,
  className,
  level = 0,
}: {
  readonly nodes: readonly TreeNode[];
  readonly className?: string;
  /** Cap long nhau, chi dung de thut le. */
  readonly level?: number;
}) {
  if (nodes.length === 0) {
    return null;
  }
  return (
    <ul className={className ?? "tc-m-tree"} data-level={level}>
      {nodes.map((node) => (
        <TreeRow key={node.href} node={node} level={level} />
      ))}
    </ul>
  );
}

function TreeRow({ node, level }: { readonly node: TreeNode; readonly level: number }) {
  const [open, setOpen] = useState(false);
  const branchId = `tc-tree-${node.href.replace(/[^a-z0-9]+/gi, "-")}`;
  const hasChildren = node.children.length > 0;

  return (
    <li className="tc-m-tree-item">
      <div className="tc-m-tree-row">
        <Link className="tc-m-tree-link" href={node.href} prefetch={false}>
          {node.label}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            className="tc-m-tree-toggle"
            aria-expanded={open}
            aria-controls={branchId}
            aria-label={
              open
                ? `Thu gọn mục ${node.label}`
                : `Mở ${node.children.length} trang trong mục ${node.label}`
            }
            onClick={() => setOpen((current) => !current)}
          >
            <Caret />
          </button>
        ) : (
          /* Khong co trang con thi van ve mui ten di toi, nhung la ky hieu
             trang tri nam trong the <a> — khong tao vung cham gia. */
          <span className="tc-m-tree-leaf" aria-hidden="true">
            ›
          </span>
        )}
      </div>

      {hasChildren ? (
        <div id={branchId} className="tc-m-tree-branch" hidden={!open}>
          <MobileTree nodes={node.children} level={level + 1} />
        </div>
      ) : null}
    </li>
  );
}

/** Mui ten chi xuong; CSS xoay no 180 do khi nhanh dang mo. */
function Caret() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4 6 L8 10.5 L12 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
