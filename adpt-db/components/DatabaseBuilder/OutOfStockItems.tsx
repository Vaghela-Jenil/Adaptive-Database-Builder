import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Package, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export type OutOfStockItem = {
  id: string;
  productName: string;
  requestedQty: number;
  availableQty: number;
  addedAt: string;
};

type OutOfStockItemsProps = {
  items: OutOfStockItem[];
  onBack: () => void;
  onRemoveItem: (id: string) => void;
};

export default function OutOfStockItems({
  items,
  onBack,
  onRemoveItem,
}: OutOfStockItemsProps) {
  const { currentTheme } = useTheme();

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
            Out of Stock Items
          </h1>
          <span
            className="text-sm px-2 py-1 rounded-full"
            style={{
              backgroundColor: "#ef444420",
              color: "#ef4444",
            }}
          >
            {items.length} items
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card
              className="p-12 text-center"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <Package
                className="w-16 h-16 mx-auto mb-4 opacity-30"
                style={{ color: currentTheme.textSecondary }}
              />
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: currentTheme.text }}
              >
                No Out of Stock Items
              </h3>
              <p style={{ color: currentTheme.textSecondary }}>
                Items that are out of stock during selling will appear here.
              </p>
            </Card>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-4 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid #ef444440`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#ef444415" }}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: currentTheme.text }}
                    >
                      {item.productName}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      Requested: {item.requestedQty} | Available:{" "}
                      {item.availableQty} | Shortfall:{" "}
                      {item.requestedQty - item.availableQty}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      Added: {new Date(item.addedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
