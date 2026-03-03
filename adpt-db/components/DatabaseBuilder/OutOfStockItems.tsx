import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ChevronLeft,
  Package,
  AlertTriangle,
  Trash2,
  ShoppingBag,
  ExternalLink,
  Store,
  Globe,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { motion, AnimatePresence } from "motion/react";

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

const ORDER_VENDORS = [
  {
    name: "Amazon",
    icon: "🛒",
    color: "#FF9900",
    bg: "#FFF8E1",
    buildUrl: (q: string) =>
      `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  {
    name: "Flipkart",
    icon: "🛍️",
    color: "#2874F0",
    bg: "#E3F2FD",
    buildUrl: (q: string) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Myntra",
    icon: "👗",
    color: "#FF3F6C",
    bg: "#FCE4EC",
    buildUrl: (q: string) =>
      `https://www.myntra.com/${encodeURIComponent(q)}`,
  },
  {
    name: "IndiaMart",
    icon: "🏭",
    color: "#1B5E20",
    bg: "#E8F5E9",
    buildUrl: (q: string) =>
      `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(q)}`,
  },
  {
    name: "JioMart",
    icon: "🏬",
    color: "#0A3D62",
    bg: "#E0F7FA",
    buildUrl: (q: string) =>
      `https://www.jiomart.com/search/${encodeURIComponent(q)}`,
  },
];

export default function OutOfStockItems({
  items,
  onBack,
  onRemoveItem,
}: OutOfStockItemsProps) {
  const { currentTheme } = useTheme();
  const [openOrderMenuId, setOpenOrderMenuId] = useState<string | null>(null);
  const [customVendorUrl, setCustomVendorUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeProductName, setActiveProductName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenOrderMenuId(null);
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOrderFromVendor = (productName: string, buildUrl: (q: string) => string) => {
    window.open(buildUrl(productName), "_blank");
    setOpenOrderMenuId(null);
  };

  const handleCustomVendorGo = () => {
    if (!customVendorUrl.trim()) return;
    let url = customVendorUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    window.open(url, "_blank");
    setCustomVendorUrl("");
    setShowCustomInput(false);
    setOpenOrderMenuId(null);
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
                className="p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid #ef444440`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: "#ef444415" }}
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold"
                        style={{ color: currentTheme.text }}
                      >
                        {item.productName}
                      </p>
                      <div
                        className="text-sm mt-1 flex flex-wrap gap-3"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}>
                          Requested: {item.requestedQty}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: "#f59e0b20", color: "#d97706" }}>
                          Available: {item.availableQty}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: "#ef444415", color: "#ef4444" }}>
                          Shortfall: {item.requestedQty - item.availableQty}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-2"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Added: {new Date(item.addedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 shrink-0 relative" ref={openOrderMenuId === item.id ? menuRef : undefined}>
                    {/* Order Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpenOrderMenuId(openOrderMenuId === item.id ? null : item.id);
                        setActiveProductName(item.productName);
                        setShowCustomInput(false);
                      }}
                      className="transition-all"
                      style={{
                        borderColor: "#10b981",
                        color: "#10b981",
                        backgroundColor: openOrderMenuId === item.id ? "#10b98115" : "transparent",
                      }}
                    >
                      <ShoppingBag className="w-4 h-4 mr-1.5" />
                      Order
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {/* Order Vendor Dropdown */}
                    <AnimatePresence>
                      {openOrderMenuId === item.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-10 z-50 w-72 rounded-xl border shadow-2xl overflow-hidden"
                          style={{
                            backgroundColor: currentTheme.surface,
                            borderColor: currentTheme.border,
                          }}
                        >
                          {/* Dropdown Header */}
                          <div
                            className="px-4 py-3 border-b flex items-center justify-between"
                            style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.primary}08` }}
                          >
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.primary }}>
                                Order From
                              </p>
                              <p className="text-[11px] mt-0.5 truncate max-w-[180px]" style={{ color: currentTheme.textSecondary }}>
                                {item.productName}
                              </p>
                            </div>
                            <button
                              onClick={() => { setOpenOrderMenuId(null); setShowCustomInput(false); }}
                              className="p-1 rounded-md hover:opacity-70 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" style={{ color: currentTheme.textSecondary }} />
                            </button>
                          </div>

                          {/* Vendor List */}
                          <div className="p-2 space-y-1">
                            {ORDER_VENDORS.map((vendor) => (
                              <button
                                key={vendor.name}
                                onClick={() => handleOrderFromVendor(item.productName, vendor.buildUrl)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{ backgroundColor: vendor.bg }}
                              >
                                <span className="text-lg">{vendor.icon}</span>
                                <span className="flex-1 text-left text-sm font-semibold" style={{ color: vendor.color }}>
                                  {vendor.name}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5" style={{ color: vendor.color, opacity: 0.6 }} />
                              </button>
                            ))}
                          </div>

                          {/* Divider */}
                          <div className="px-3">
                            <div className="h-px w-full" style={{ backgroundColor: currentTheme.border }} />
                          </div>

                          {/* Custom Vendor */}
                          <div className="p-2">
                            {!showCustomInput ? (
                              <button
                                onClick={() => setShowCustomInput(true)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:opacity-80"
                                style={{ backgroundColor: `${currentTheme.primary}10` }}
                              >
                                <Globe className="w-4 h-4" style={{ color: currentTheme.primary }} />
                                <span className="flex-1 text-left text-sm font-semibold" style={{ color: currentTheme.primary }}>
                                  Custom Vendor / URL
                                </span>
                                <Store className="w-3.5 h-3.5" style={{ color: currentTheme.primary, opacity: 0.6 }} />
                              </button>
                            ) : (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="space-y-2 px-1"
                              >
                                <p className="text-xs font-medium" style={{ color: currentTheme.textSecondary }}>
                                  Enter your vendor / supplier URL:
                                </p>
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    placeholder="e.g. vendor-site.com"
                                    value={customVendorUrl}
                                    onChange={(e) => setCustomVendorUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCustomVendorGo()}
                                    className="text-sm h-9"
                                    style={{
                                      backgroundColor: currentTheme.background,
                                      border: `1px solid ${currentTheme.border}`,
                                      color: currentTheme.text,
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleCustomVendorGo}
                                    disabled={!customVendorUrl.trim()}
                                    className="h-9 px-3"
                                    style={{
                                      backgroundColor: customVendorUrl.trim() ? currentTheme.primary : `${currentTheme.primary}40`,
                                      color: "#fff",
                                    }}
                                  >
                                    Go
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
