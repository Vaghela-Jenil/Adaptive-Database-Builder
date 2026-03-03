import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, FileText, Download, Trash2, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { InvoiceData } from "./SellStocks";
import { downloadInvoicePDF, openInvoicePDFInNewTab } from "@/lib/invoicePdf";

type GeneratedInvoicesProps = {
  invoices: InvoiceData[];
  onBack: () => void;
  onRemoveInvoice: (id: string) => void;
};

export default function GeneratedInvoices({
  invoices,
  onBack,
  onRemoveInvoice,
}: GeneratedInvoicesProps) {
  const { currentTheme } = useTheme();

  const handleDownload = (invoice: InvoiceData) => {
    downloadInvoicePDF(invoice);
  };

  const handleView = (invoice: InvoiceData) => {
    openInvoicePDFInNewTab(invoice);
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            style={{ backgroundColor: currentTheme.primary, color: "#fff" }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1
            className="text-xl font-bold"
            style={{ color: currentTheme.text }}
          >
            Generated Invoices
          </h1>
          <span
            className="text-sm px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${currentTheme.primary}20`,
              color: currentTheme.primary,
            }}
          >
            {invoices.length} invoices
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {invoices.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card
              className="p-12 text-center"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <FileText
                className="w-16 h-16 mx-auto mb-4 opacity-30"
                style={{ color: currentTheme.textSecondary }}
              />
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: currentTheme.text }}
              >
                No Invoices Yet
              </h3>
              <p style={{ color: currentTheme.textSecondary }}>
                Complete a sale to see invoices here.
              </p>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {invoices
              .slice()
              .reverse()
              .map((invoice) => (
                <Card
                  key={invoice.id}
                  className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    backgroundColor: currentTheme.surface,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: currentTheme.text }}
                      >
                        {invoice.id}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        {new Date(invoice.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                        {invoice.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(invoice)}
                        style={{ color: "#6366f1" }}
                        title="View Invoice PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(invoice)}
                        style={{ color: currentTheme.primary }}
                        title="Download Invoice PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveInvoice(invoice.id)}
                        style={{ color: "#ef4444" }}
                        title="Remove Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          className="border-b"
                          style={{ borderColor: currentTheme.border }}
                        >
                          <th
                            className="text-left py-2 font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Product
                          </th>
                          <th
                            className="text-right py-2 font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Qty
                          </th>
                          <th
                            className="text-right py-2 font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Price
                          </th>
                          <th
                            className="text-right py-2 font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Tax
                          </th>
                          <th
                            className="text-right py-2 font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b"
                            style={{ borderColor: `${currentTheme.border}50` }}
                          >
                            <td
                              className="py-2"
                              style={{ color: currentTheme.text }}
                            >
                              {item.productName}
                            </td>
                            <td
                              className="py-2 text-right"
                              style={{ color: currentTheme.text }}
                            >
                              {item.qty}
                            </td>
                            <td
                              className="py-2 text-right"
                              style={{ color: currentTheme.text }}
                            >
                              ₹{item.price.toFixed(2)}
                            </td>
                            <td
                              className="py-2 text-right"
                              style={{ color: currentTheme.textSecondary }}
                            >
                              ₹{item.taxAmount.toFixed(2)}
                            </td>
                            <td
                              className="py-2 text-right font-semibold"
                              style={{ color: currentTheme.text }}
                            >
                              ₹{item.totalPrice.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div
                    className="mt-3 pt-3 border-t flex justify-end"
                    style={{ borderColor: currentTheme.border }}
                  >
                    <div className="text-right space-y-1">
                      <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                        Subtotal: ₹{invoice.subtotal.toFixed(2)}
                      </p>
                      <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                        Tax: ₹{invoice.totalTax.toFixed(2)}
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: currentTheme.primary }}
                      >
                        Grand Total: ₹{invoice.grandTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
