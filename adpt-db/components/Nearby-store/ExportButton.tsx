"use client";

import { useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Place } from "./types";
import { buildExportRows } from "../../lib/normalize";
import { useTheme } from "@/context/ThemeContext";

function toCsvValue(value: string | number) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => toCsvValue(row[header])).join(","));
  }
  return lines.join("\n");
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadPdf(fileBase: string, rows: Array<Record<string, string | number>>) {
  const doc = new jsPDF();

  if (!rows.length) {
    doc.text("No data to export", 14, 20);
    doc.save(`${fileBase}.pdf`);
    return;
  }

  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => String(row[header] ?? "")));

  autoTable(doc, {
    head: [headers],
    body,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fontStyle: "bold" },
  });

  doc.save(`${fileBase}.pdf`);
}

export default function ExportButtons({
  places,
  fileBase
}: {
  places: Place[];
  fileBase: string;
}) {
  const rows = useMemo(() => buildExportRows(places), [places]);
  const { currentTheme } = useTheme();

  return (
    <div className="flex export-row gap-3">
      <button
        className="btn ghost p-2 rounded-md"
          style={{ color: currentTheme.text, backgroundColor: currentTheme.primary}}
        onClick={() => {
          const csv = buildCsv(rows);
          downloadBlob(`${fileBase}.csv`, new Blob([csv], { type: "text/csv" }));
        }}
      >
        Download CSV
      </button>
      <button
        className="btn ghost p-2 rounded-md"
        style={{color: currentTheme.text, backgroundColor: currentTheme.primary}}
        onClick={() => downloadPdf(fileBase, rows)}
      >
        Download PDF
      </button>
    </div>
  );
}