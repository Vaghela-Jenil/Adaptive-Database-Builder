import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvoiceData } from "@/components/DatabaseBuilder/SellStocks";

export function generateInvoicePDF(invoice: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ===== HEADER BANNER =====
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 48, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", 20, 28);

  // Invoice # and Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 210, 225);
  doc.text(`#${invoice.id}`, pageWidth - 20, 20, { align: "right" });
  doc.text(
    `Date: ${new Date(invoice.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`,
    pageWidth - 20,
    30,
    { align: "right" }
  );
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, 40, {
    align: "right",
  });

  // ===== ACCENT LINE =====
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 48, pageWidth, 3, "F");

  // ===== TABLE =====
  const tableBody = invoice.items.map((item, index) => [
    (index + 1).toString(),
    item.productName,
    item.qty.toString(),
    `Rs.${item.unitPrice.toFixed(2)}`,
    `Rs.${item.price.toFixed(2)}`,
    `${item.taxPercent}%`,
    `Rs.${item.taxAmount.toFixed(2)}`,
    `Rs.${item.totalPrice.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [
      [
        "#",
        "Product",
        "Qty",
        "Unit Price",
        "Price",
        "Tax %",
        "Tax Amt",
        "Total",
      ],
    ],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249], // slate-100
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { halign: "left", cellWidth: 45 },
      2: { cellWidth: 15 },
    },
    margin: { left: 14, right: 14 },
    styles: {
      cellPadding: 4,
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
    },
  });

  // ===== TOTALS SECTION =====
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Background box for totals
  const totalsBoxX = pageWidth - 90;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsBoxX - 5, finalY - 4, 85, 52, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105); // slate-600

  doc.text("Subtotal:", totalsBoxX, finalY + 6);
  doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, pageWidth - 16, finalY + 6, {
    align: "right",
  });

  doc.text("Tax:", totalsBoxX, finalY + 18);
  doc.text(`Rs.${invoice.totalTax.toFixed(2)}`, pageWidth - 16, finalY + 18, {
    align: "right",
  });

  // Divider line
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(totalsBoxX, finalY + 24, pageWidth - 12, finalY + 24);

  // Grand total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Grand Total:", totalsBoxX, finalY + 36);
  doc.setTextColor(99, 102, 241);
  doc.text(
    `Rs.${invoice.grandTotal.toFixed(2)}`,
    pageWidth - 16,
    finalY + 36,
    { align: "right" }
  );

  // ===== FOOTER =====
  const footerY = finalY + 64;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Thank you for your business!", 14, footerY + 10);
  doc.text(
    `Generated on ${new Date().toLocaleString("en-IN")}`,
    pageWidth - 14,
    footerY + 10,
    { align: "right" }
  );

  // ===== ITEMS COUNT BADGE =====
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(14, footerY + 16, 50, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${invoice.items.length} item${invoice.items.length !== 1 ? "s" : ""} sold`,
    39,
    footerY + 21.5,
    { align: "center" }
  );

  return doc;
}

export function downloadInvoicePDF(invoice: InvoiceData) {
  const doc = generateInvoicePDF(invoice);
  doc.save(`${invoice.id}.pdf`);
}

export function openInvoicePDFInNewTab(invoice: InvoiceData) {
  const doc = generateInvoicePDF(invoice);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
