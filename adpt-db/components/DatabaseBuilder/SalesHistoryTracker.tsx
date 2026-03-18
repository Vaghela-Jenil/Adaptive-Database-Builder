import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, History, Package } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { InvoiceData } from "./SellStocks";

type SalesHistoryTrackerProps = {
  invoices: InvoiceData[];
  onBack: () => void;
  onOpenRecommender: () => void;
};

type DailySalesRecord = {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  price: number;
  recordId: string;
};

type SoldQuantitySummary = {
  id: string;
  productName: string;
  recordId: string;
  soldQuantity: number;
  totalSales: number;
  lastSoldAt: string;
};

export default function SalesHistoryTracker({
  invoices,
  onBack,
  onOpenRecommender,
}: SalesHistoryTrackerProps) {
  const { currentTheme } = useTheme();

  const dailySalesRecords = useMemo<DailySalesRecord[]>(() => {
    const rows: DailySalesRecord[] = [];

    invoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        rows.push({
          id: `${invoice.id}-${item.id}`,
          date: invoice.date,
          productName: item.productName,
          quantity: item.qty,
          price: item.totalPrice,
          recordId: item.recordId,
        });
      });
    });

    return rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices]);

  const soldQuantityByItem = useMemo<SoldQuantitySummary[]>(() => {
    const map = new Map<string, SoldQuantitySummary>();

    dailySalesRecords.forEach((row) => {
      const key = row.recordId || row.productName.toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.soldQuantity += row.quantity;
        existing.totalSales += row.price;
        if (new Date(row.date).getTime() > new Date(existing.lastSoldAt).getTime()) {
          existing.lastSoldAt = row.date;
        }
      } else {
        map.set(key, {
          id: key,
          productName: row.productName,
          recordId: row.recordId,
          soldQuantity: row.quantity,
          totalSales: row.price,
          lastSoldAt: row.date,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.soldQuantity - a.soldQuantity);
  }, [dailySalesRecords]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: currentTheme.background }}>
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
          <h1 className="text-xl font-bold" style={{ color: currentTheme.text }}>
            Daily Sales History
          </h1>
          <span
            className="text-sm px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${currentTheme.primary}20`,
              color: currentTheme.primary,
            }}
          >
            {dailySalesRecords.length} records
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenRecommender}
            style={{
              borderColor: currentTheme.border,
              color: "#fff",
              backgroundColor: currentTheme.primary,
           
            }}
          >
            Open Recommender
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card
          className="p-5"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
              Sales Record
            </h2>
            
          </div>

          {dailySalesRecords.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: currentTheme.textSecondary }} />
              <p className="font-semibold" style={{ color: currentTheme.text }}>
                No Sales Records Yet
              </p>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                Generate invoices from Sell Stocks to start tracking daily sales.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: currentTheme.border }}>
                    <th className="text-left py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Date</th>
                    <th className="text-left py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Product</th>
                    <th className="text-right py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Qty Sold</th>
                    <th className="text-right py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySalesRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b"
                      style={{ borderColor: `${currentTheme.border}70` }}
                    >
                      <td className="py-2" style={{ color: currentTheme.text }}>
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="py-2" style={{ color: currentTheme.text }}>
                        {record.productName}
                      </td>
                      <td className="py-2 text-right font-semibold" style={{ color: currentTheme.text }}>
                        {record.quantity}
                      </td>
                      <td className="py-2 text-right" style={{ color: currentTheme.text }}>
                        ₹{record.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          className="p-5"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
              Auto Sold Quantity by Item
            </h2>
          
          </div>

          {soldQuantityByItem.length === 0 ? (
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
              No sold-quantity summary available yet.
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: currentTheme.border }}>
                    <th className="text-left py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Item</th>
                    <th className="text-right py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Sold Qty</th>
                    <th className="text-right py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Total Sales</th>
                    <th className="text-right py-2 font-medium" style={{ color: currentTheme.textSecondary }}>Last Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {soldQuantityByItem.map((item) => (
                    <tr key={item.id} className="border-b" style={{ borderColor: `${currentTheme.border}70` }}>
                      <td className="py-2" style={{ color: currentTheme.text }}>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" style={{ color: currentTheme.primary }} />
                          <span>{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right font-semibold" style={{ color: currentTheme.text }}>
                        {item.soldQuantity}
                      </td>
                      <td className="py-2 text-right" style={{ color: currentTheme.text }}>
                        ₹{item.totalSales.toFixed(2)}
                      </td>
                      <td className="py-2 text-right" style={{ color: currentTheme.textSecondary }}>
                        {new Date(item.lastSoldAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
