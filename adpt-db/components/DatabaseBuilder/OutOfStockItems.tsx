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
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Link2,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { motion, AnimatePresence } from "motion/react";

export type OrderStatus = "not_ordered" | "ordered" | "shipped" | "out_for_delivery" | "delivered";

export type OutOfStockItem = {
  id: string;
  productName: string;
  requestedQty: number;
  availableQty: number;
  addedAt: string;
  orderStatus?: OrderStatus;
  orderedFrom?: string;
  orderedAt?: string;
  trackingUrl?: string;
  trackingId?: string;
};

type OutOfStockItemsProps = {
  items: OutOfStockItem[];
  onBack: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<OutOfStockItem>) => void;
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

const ORDER_STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: "not_ordered", label: "Not Ordered", icon: Clock },
  { key: "ordered", label: "Ordered", icon: ShoppingBag },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  not_ordered: "#94a3b8",
  ordered: "#3b82f6",
  shipped: "#f59e0b",
  out_for_delivery: "#8b5cf6",
  delivered: "#10b981",
};

// Vendor tracking page URLs
const VENDOR_TRACKING_URLS: Record<string, string> = {
  Amazon: "https://www.amazon.in/gp/your-account/order-history",
  Flipkart: "https://www.flipkart.com/account/orders",
  Myntra: "https://www.myntra.com/my/orders",
  IndiaMart: "https://my.indiamart.com/buyerledger/",
  JioMart: "https://www.jiomart.com/orders",
};

export default function OutOfStockItems({
  items,
  onBack,
  onRemoveItem,
  onUpdateItem,
}: OutOfStockItemsProps) {
  const { currentTheme } = useTheme();
  const [openOrderMenuId, setOpenOrderMenuId] = useState<string | null>(null);
  const [customVendorUrl, setCustomVendorUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeProductName, setActiveProductName] = useState("");
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingUrlInput, setTrackingUrlInput] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenOrderMenuId(null);
        setShowCustomInput(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setOpenStatusMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOrderFromVendor = (itemId: string, productName: string, vendorName: string, buildUrl: (q: string) => string) => {
    window.open(buildUrl(productName), "_blank");
    onUpdateItem(itemId, {
      orderStatus: "ordered",
      orderedFrom: vendorName,
      orderedAt: new Date().toISOString(),
    });
    setOpenOrderMenuId(null);
  };

  const handleCustomVendorGo = (itemId: string) => {
    if (!customVendorUrl.trim()) return;
    let url = customVendorUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    window.open(url, "_blank");
    onUpdateItem(itemId, {
      orderStatus: "ordered",
      orderedFrom: "Custom Vendor",
      orderedAt: new Date().toISOString(),
      trackingUrl: url,
    });
    setCustomVendorUrl("");
    setShowCustomInput(false);
    setOpenOrderMenuId(null);
  };

  const handleSaveTracking = (itemId: string) => {
    onUpdateItem(itemId, {
      trackingId: trackingInput,
      trackingUrl: trackingUrlInput,
    });
    setEditingTrackingId(null);
    setTrackingInput("");
    setTrackingUrlInput("");
  };

  const handleTrackOrder = (item: OutOfStockItem) => {
    if (item.trackingUrl) {
      let url = item.trackingUrl;
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      window.open(url, "_blank");
    } else if (item.orderedFrom && VENDOR_TRACKING_URLS[item.orderedFrom]) {
      window.open(VENDOR_TRACKING_URLS[item.orderedFrom], "_blank");
    }
  };

  const getStatusIndex = (status?: OrderStatus) => {
    if (!status) return 0;
    return ORDER_STATUS_STEPS.findIndex((s) => s.key === status);
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
            {items.map((item) => {
              const currentStatusIdx = getStatusIndex(item.orderStatus);
              const statusColor = STATUS_COLORS[item.orderStatus || "not_ordered"];
              const isOrdered = item.orderStatus && item.orderStatus !== "not_ordered";

              return (
              <Card
                key={item.id}
                className="p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${isOrdered ? statusColor + "40" : "#ef444440"}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: isOrdered ? statusColor + "15" : "#ef444415" }}
                    >
                      {isOrdered
                        ? (() => { const Icon = ORDER_STATUS_STEPS[currentStatusIdx].icon; return <Icon className="w-5 h-5" style={{ color: statusColor }} />; })()
                        : <AlertTriangle className="w-5 h-5 text-red-500" />
                      }
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
                      {isOrdered ? "Reorder" : "Order"}
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
                                onClick={() => handleOrderFromVendor(item.id, item.productName, vendor.name, vendor.buildUrl)}
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
                                    onKeyDown={(e) => e.key === "Enter" && handleCustomVendorGo(item.id)}
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
                                    onClick={() => handleCustomVendorGo(item.id)}
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

                {/* ── Order Status Tracking Section ── */}
                {isOrdered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4"
                    style={{ borderTop: `1px solid ${currentTheme.border}` }}
                  >
                    {/* Status Progress Bar */}
                    <div className="flex items-center gap-1 mb-3">
                      {ORDER_STATUS_STEPS.map((step, idx) => {
                        const isActive = idx <= currentStatusIdx;
                        const isCurrent = idx === currentStatusIdx;
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                  backgroundColor: isActive ? statusColor : `${currentTheme.textSecondary}20`,
                                  boxShadow: isCurrent ? `0 0 0 3px ${statusColor}30` : "none",
                                }}
                              >
                                <StepIcon className="w-3.5 h-3.5" style={{ color: isActive ? "#fff" : currentTheme.textSecondary }} />
                              </div>
                              <span
                                className="text-[10px] mt-1 text-center leading-tight"
                                style={{
                                  color: isActive ? statusColor : currentTheme.textSecondary,
                                  fontWeight: isCurrent ? 700 : 400,
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                            {idx < ORDER_STATUS_STEPS.length - 1 && (
                              <div
                                className="h-0.5 flex-1 rounded-full mx-0.5 -mt-4"
                                style={{
                                  backgroundColor: idx < currentStatusIdx ? statusColor : `${currentTheme.textSecondary}20`,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Info & Actions Bar */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {/* Ordered from badge */}
                      {item.orderedFrom && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: statusColor + "15", color: statusColor }}
                        >
                          <Store className="w-3 h-3" />
                          {item.orderedFrom}
                        </span>
                      )}

                      {/* Ordered at */}
                      {item.orderedAt && (
                        <span
                          className="text-xs px-2 py-1 rounded-md"
                          style={{ backgroundColor: `${currentTheme.textSecondary}10`, color: currentTheme.textSecondary }}
                        >
                          Ordered: {new Date(item.orderedAt).toLocaleDateString()}
                        </span>
                      )}

                      {/* Tracking ID badge */}
                      {item.trackingId && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}
                        >
                          <Link2 className="w-3 h-3" />
                          {item.trackingId}
                        </span>
                      )}

                      <div className="flex-1" />

                      {/* Track Order button */}
                      {(item.trackingUrl || (item.orderedFrom && VENDOR_TRACKING_URLS[item.orderedFrom])) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrackOrder(item)}
                          className="h-7 text-xs"
                          style={{ borderColor: statusColor, color: statusColor }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Track Order
                        </Button>
                      )}

                      {/* Add/Edit Tracking Info */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingTrackingId === item.id) {
                            setEditingTrackingId(null);
                          } else {
                            setEditingTrackingId(item.id);
                            setTrackingInput(item.trackingId || "");
                            setTrackingUrlInput(item.trackingUrl || "");
                          }
                        }}
                        className="h-7 text-xs"
                        style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        {item.trackingId ? "Edit Tracking" : "Add Tracking"}
                      </Button>

                      {/* Update Status Dropdown */}
                      <div className="relative" ref={openStatusMenuId === item.id ? statusMenuRef : undefined}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenStatusMenuId(openStatusMenuId === item.id ? null : item.id)}
                          className="h-7 text-xs"
                          style={{ borderColor: statusColor, color: statusColor }}
                        >
                          Update Status
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>

                        <AnimatePresence>
                          {openStatusMenuId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-8 z-50 w-52 rounded-lg border shadow-xl overflow-hidden"
                              style={{
                                backgroundColor: currentTheme.surface,
                                borderColor: currentTheme.border,
                              }}
                            >
                              <div className="p-1.5 space-y-0.5">
                                {ORDER_STATUS_STEPS.filter((s) => s.key !== "not_ordered").map((step) => {
                                  const StepIcon = step.icon;
                                  const isCurrentStatus = item.orderStatus === step.key;
                                  const stepColor = STATUS_COLORS[step.key];
                                  return (
                                    <button
                                      key={step.key}
                                      onClick={() => {
                                        onUpdateItem(item.id, { orderStatus: step.key });
                                        setOpenStatusMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm"
                                      style={{
                                        backgroundColor: isCurrentStatus ? stepColor + "15" : "transparent",
                                        color: isCurrentStatus ? stepColor : currentTheme.text,
                                        fontWeight: isCurrentStatus ? 600 : 400,
                                      }}
                                    >
                                      <StepIcon className="w-4 h-4" style={{ color: stepColor }} />
                                      {step.label}
                                      {isCurrentStatus && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" style={{ color: stepColor }} />}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Tracking Input Form (expandable) */}
                    <AnimatePresence>
                      {editingTrackingId === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2 overflow-hidden"
                        >
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[11px] font-medium mb-1 block" style={{ color: currentTheme.textSecondary }}>
                                Tracking / Order ID
                              </label>
                              <Input
                                type="text"
                                placeholder="e.g. AWB12345678"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                className="text-sm h-8"
                                style={{
                                  backgroundColor: currentTheme.background,
                                  border: `1px solid ${currentTheme.border}`,
                                  color: currentTheme.text,
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[11px] font-medium mb-1 block" style={{ color: currentTheme.textSecondary }}>
                                Tracking URL
                              </label>
                              <Input
                                type="text"
                                placeholder="e.g. https://track.vendor.com/..."
                                value={trackingUrlInput}
                                onChange={(e) => setTrackingUrlInput(e.target.value)}
                                className="text-sm h-8"
                                style={{
                                  backgroundColor: currentTheme.background,
                                  border: `1px solid ${currentTheme.border}`,
                                  color: currentTheme.text,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTrackingId(null)}
                              className="h-7 text-xs"
                              style={{ color: currentTheme.textSecondary }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveTracking(item.id)}
                              className="h-7 text-xs"
                              style={{ backgroundColor: currentTheme.primary, color: "#fff" }}
                            >
                              Save Tracking Info
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
