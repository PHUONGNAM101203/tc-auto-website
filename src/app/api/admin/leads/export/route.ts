import { NextResponse } from "next/server";
import { readAdminGate } from "@/lib/admin/auth";
import { listLeads } from "@/lib/admin/queries";
import { LEAD_STATUS_LABEL, LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;

/** Boc gia tri CSV: nhan doi dau ngoac kep, luon boc trong ngoac kep. */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Chan CSV injection: o bat dau bang = + - @ TAB CR se bi Excel/Sheets coi la
 * cong thuc. Them dau nhay don o dau de vo hieu hoa.
 */
function safeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return csvCell(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
}

export async function GET(request: Request) {
  const gate = await readAdminGate();
  if (gate.kind !== "ok") {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusRaw = searchParams.get("status") ?? "";
  const status = LEAD_STATUSES.includes(statusRaw as LeadStatus)
    ? (statusRaw as LeadStatus)
    : "all";
  const search = searchParams.get("q")?.slice(0, 80) ?? "";

  try {
    const result = await listLeads({ status, search, page: 1, perPage: 100 });
    const rows = [...result.rows];

    // Lay tiep cac trang con lai, co chan tren de khong lam kiet bo nho.
    for (let page = 2; page <= result.pageCount && rows.length < MAX_ROWS; page += 1) {
      const next = await listLeads({ status, search, page, perPage: 100 });
      rows.push(...next.rows);
    }

    const header = [
      "Thời điểm",
      "Họ và tên",
      "Số điện thoại",
      "Trạng thái",
      "Trang nguồn",
      "Nội dung",
      "Ghi chú",
    ];

    const body = rows.slice(0, MAX_ROWS).map((lead) =>
      [
        lead.createdAt,
        lead.name,
        lead.phone,
        LEAD_STATUS_LABEL[lead.status],
        lead.sourcePage,
        lead.message ?? "",
        lead.note ?? "",
      ]
        .map(safeCell)
        .join(","),
    );

    // BOM UTF-8 de Excel tren Windows doc dung tieng Viet.
    const csv = `﻿${header.map(csvCell).join(",")}\r\n${body.join("\r\n")}\r\n`;
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tc-auto-leads-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/admin/leads/export]", error);
    return NextResponse.json({ error: "Không xuất được dữ liệu." }, { status: 500 });
  }
}
