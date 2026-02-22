"use client";

import { useMemo } from "react";
import { Place } from "./types";
import { buildExportRows } from "../../lib/normalize";

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

export default function ExportButtons({
  places,
  fileBase
}: {
  places: Place[];
  fileBase: string;
}) {
  const rows = useMemo(() => buildExportRows(places), [places]);

  const handlePdfDownload = async () => {
    if (!rows.length) {
      downloadBlob(`${fileBase}.pdf`, new Blob([], { type: "application/pdf" }));
      return;
    }

    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const autoTable = autoTableModule.default;
    const doc = new jsPDF("l", "mm", "a4");
    const headers = Object.keys(rows[0]);
    const body = rows.map((row) => headers.map((header) => String(row[header] ?? "")));

    doc.setFontSize(12);
    doc.text("Nearby Store Search Results", 14, 14);
    autoTable(doc, {
      head: [headers],
      body,
      startY: 18,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [31, 41, 55] },
      margin: { left: 8, right: 8 },
    });

    doc.save(`${fileBase}.pdf`);
  };

  return (
    <div className="export-row">
      <button
        className="btn ghost"
        onClick={() => {
          const csv = buildCsv(rows);
          downloadBlob(`${fileBase}.csv`, new Blob([csv], { type: "text/csv" }));
        }}
      >
        Download CSV
      </button>
      <button
        className="btn ghost"
        onClick={handlePdfDownload}
      >
        Download PDF
      </button>
    </div>
  );
}
