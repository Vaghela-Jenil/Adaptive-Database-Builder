import { useState, useMemo, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ChevronLeft,
  Search,
  Plus,
  Upload,
  ShoppingCart,
  AlertTriangle,
  Package,
  X,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { DatabaseRecord, FieldAttributes } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { showToast } from "@/lib/toast";
import axios from "axios";
import { downloadInvoicePDF, openInvoicePDFInNewTab } from "@/lib/invoicePdf";

type SelectedItem = {
  id: string;
  recordId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  price: number;
  taxPercent: number;
  taxAmount: number;
  totalPrice: number;
  status: "in-stock" | "out-of-stock";
};

type SellStocksProps = {
  records: DatabaseRecord[];
  formSchema: FieldAttributes[];
  databaseId: string;
  onBack: () => void;
  onAddOutOfStock: (item: {
    productName: string;
    requestedQty: number;
    availableQty: number;
  }) => void;
  onGenerateInvoice: (invoice: InvoiceData) => void;
  onStockUpdated: () => void;
};

export type InvoiceData = {
  id: string;
  date: string;
  items: SelectedItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  status: "completed";
};

// Helper: try to find field ID by keywords
const findFieldByKeywords = (
  fields: FieldAttributes[],
  keywords: string[]
): string => {
  const normalized = keywords.map((k) => k.toLowerCase());
  const match = fields.find((f) => {
    const source = `${f.id} ${f.label}`.toLowerCase();
    return normalized.some((kw) => source.includes(kw));
  });
  return match?.id || "";
};

export default function SellStocks({
  records,
  formSchema,
  databaseId,
  onBack,
  onAddOutOfStock,
  onGenerateInvoice,
  onStockUpdated,
}: SellStocksProps) {
  const { currentTheme } = useTheme();

  // Auto-detect field IDs
  const dataFields = useMemo(
    () => formSchema.filter((f) => f.type !== "text" && f.type !== "separator"),
    [formSchema]
  );

  const nameFieldId = useMemo(
    () => findFieldByKeywords(dataFields, ["name", "product", "item", "title"]),
    [dataFields]
  );
  const priceFieldId = useMemo(
    () => findFieldByKeywords(dataFields, ["price", "cost", "rate", "mrp"]),
    [dataFields]
  );
  const qtyFieldId = useMemo(
    () =>
      findFieldByKeywords(dataFields, [
        "qty",
        "quantity",
        "stock",
        "inventory",
        "count",
        "units",
      ]),
    [dataFields]
  );
  const taxFieldId = useMemo(
    () => findFieldByKeywords(dataFields, ["tax", "gst", "vat"]),
    [dataFields]
  );

  // Product selection
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [sellQty, setSellQty] = useState<number>(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected items cart
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Invoice page
  const [showInvoice, setShowInvoice] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filtered products for dropdown
  const filteredProducts = useMemo(() => {
    return records.filter((r) => {
      const name = String(r.data[nameFieldId] || "").toLowerCase();
      return name.includes(productSearch.toLowerCase());
    });
  }, [records, nameFieldId, productSearch]);

  // Selected record data
  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId),
    [records, selectedRecordId]
  );

  const productName = selectedRecord
    ? String(selectedRecord.data[nameFieldId] || "Unknown")
    : "";
  const unitPrice = selectedRecord
    ? Number(selectedRecord.data[priceFieldId] || 0)
    : 0;
  const availableQty = selectedRecord
    ? Number(selectedRecord.data[qtyFieldId] || 0)
    : 0;
  const taxPercent = selectedRecord
    ? taxFieldId
      ? Number(selectedRecord.data[taxFieldId] || 5)
      : 5
    : 5;

  const price = unitPrice * sellQty;
  const taxAmount = (price * taxPercent) / 100;
  const totalPrice = price + taxAmount;

  // Already sold qty for this product in current cart
  const alreadyInCart = useMemo(() => {
    return selectedItems
      .filter((item) => item.recordId === selectedRecordId)
      .reduce((sum, item) => sum + item.qty, 0);
  }, [selectedItems, selectedRecordId]);

  const effectiveAvailable = availableQty - alreadyInCart;
  const stockStatus: "in-stock" | "out-of-stock" =
    selectedRecordId && sellQty > effectiveAvailable
      ? "out-of-stock"
      : "in-stock";

  const handleSelectProduct = (recordId: string) => {
    setSelectedRecordId(recordId);
    const rec = records.find((r) => r.id === recordId);
    setProductSearch(String(rec?.data[nameFieldId] || ""));
    setShowDropdown(false);
    setSellQty(1);
  };

  const handleAddToOutOfStock = () => {
    if (!selectedRecord) return;
    onAddOutOfStock({
      productName,
      requestedQty: sellQty,
      availableQty: effectiveAvailable,
    });
    showToast.success(`"${productName}" added to Out of Stock list`);
  };

  const handleUploadToCart = () => {
    if (!selectedRecord || stockStatus === "out-of-stock") return;

    const item: SelectedItem = {
      id: `${selectedRecordId}-${Date.now()}`,
      recordId: selectedRecordId,
      productName,
      qty: sellQty,
      unitPrice,
      price,
      taxPercent,
      taxAmount,
      totalPrice,
      status: "in-stock",
    };

    setSelectedItems((prev) => [...prev, item]);
    setSelectedRecordId("");
    setProductSearch("");
    setSellQty(1);
    showToast.success(`"${productName}" added to cart`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const cartSubtotal = selectedItems.reduce((s, i) => s + i.price, 0);
  const cartTotalTax = selectedItems.reduce((s, i) => s + i.taxAmount, 0);
  const cartGrandTotal = selectedItems.reduce((s, i) => s + i.totalPrice, 0);

  const handleCheckInvoice = () => {
    if (selectedItems.length === 0) {
      showToast.warning("Add items to the cart first");
      return;
    }
    setShowInvoice(true);
  };

  const handleFinalCheckout = async () => {
    setIsProcessing(true);
    try {
      // Update each product's qty in the database
      for (const item of selectedItems) {
        const record = records.find((r) => r.id === item.recordId);
        if (!record) continue;

        const currentQty = Number(record.data[qtyFieldId] || 0);
        const newQty = currentQty - item.qty;

        const updatedData = { ...record.data, [qtyFieldId]: Math.max(0, newQty) };

        await axios.put(
          `/api/databases/${databaseId}/records/${item.recordId}`,
          { data: updatedData }
        );
      }

      // Generate invoice
      const invoice: InvoiceData = {
        id: `INV-${Date.now()}`,
        date: new Date().toISOString(),
        items: [...selectedItems],
        subtotal: cartSubtotal,
        totalTax: cartTotalTax,
        grandTotal: cartGrandTotal,
        status: "completed",
      };

      onGenerateInvoice(invoice);
      onStockUpdated();
      setCheckoutSuccess(true);
    } catch (error) {
      console.error("Checkout failed:", error);
      showToast.error("Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    const invoiceForPdf: InvoiceData = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...selectedItems],
      subtotal: cartSubtotal,
      totalTax: cartTotalTax,
      grandTotal: cartGrandTotal,
      status: "completed",
    };
    downloadInvoicePDF(invoiceForPdf);
  };

  const handleViewInvoice = () => {
    const invoiceForPdf: InvoiceData = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...selectedItems],
      subtotal: cartSubtotal,
      totalTax: cartTotalTax,
      grandTotal: cartGrandTotal,
      status: "completed",
    };
    openInvoicePDFInNewTab(invoiceForPdf);
  };

  const handleDoneAfterCheckout = () => {
    setCheckoutSuccess(false);
    setShowInvoice(false);
    setSelectedItems([]);
    setSelectedRecordId("");
    setProductSearch("");
    setSellQty(1);
    onBack();
  };

  // ===== INVOICE VIEW =====
  if (showInvoice) {
    return (
      <div
        className="h-full flex flex-col"
        style={{ backgroundColor: currentTheme.background }}
      >
        {/* Checkout Success Popup */}
        <AnimatePresence>
          {checkoutSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
                style={{ backgroundColor: currentTheme.surface }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#10b981" }}
                >
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: currentTheme.text }}
                >
                  Sale Successful!
                </h2>
                <p
                  className="mb-6"
                  style={{ color: currentTheme.textSecondary }}
                >
                  The inventory has been updated and invoice has been generated.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleViewInvoice}
                    style={{
                      backgroundColor: "#6366f1",
                      color: "#fff",
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View PDF
                  </Button>
                  <Button
                    onClick={handleDownloadInvoice}
                    style={{
                      backgroundColor: currentTheme.primary,
                      color: "#fff",
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDoneAfterCheckout}
                    style={{
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                    }}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invoice Header */}
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
              onClick={() => setShowInvoice(false)}
              style={{
                backgroundColor: currentTheme.primary,
                color: "#fff",
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Cart
            </Button>
            <h1
              className="text-xl font-bold"
              style={{ color: currentTheme.text }}
            >
              Invoice Preview
            </h1>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-auto p-6">
          <Card
            className="max-w-3xl mx-auto p-8"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  INVOICE
                </h2>
                <p
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  #{`INV-${Date.now()}`}
                </p>
              </div>
              <p
                className="text-sm"
                style={{ color: currentTheme.textSecondary }}
              >
                {new Date().toLocaleDateString()}
              </p>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: currentTheme.border }}
                >
                  <th
                    className="text-left py-3 text-sm font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Product
                  </th>
                  <th
                    className="text-right py-3 text-sm font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Qty
                  </th>
                  <th
                    className="text-right py-3 text-sm font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Unit Price
                  </th>
                  <th
                    className="text-right py-3 text-sm font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Price
                  </th>
                  <th
                    className="text-right py-3 text-sm font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Tax
                  </th>
                  <th
                    className="text-right py-3 text-sm font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: currentTheme.border }}
                  >
                    <td
                      className="py-3 text-sm"
                      style={{ color: currentTheme.text }}
                    >
                      {item.productName}
                    </td>
                    <td
                      className="py-3 text-sm text-right"
                      style={{ color: currentTheme.text }}
                    >
                      {item.qty}
                    </td>
                    <td
                      className="py-3 text-sm text-right"
                      style={{ color: currentTheme.text }}
                    >
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td
                      className="py-3 text-sm text-right"
                      style={{ color: currentTheme.text }}
                    >
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td
                      className="py-3 text-sm text-right"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      {item.taxPercent}% (₹{item.taxAmount.toFixed(2)})
                    </td>
                    <td
                      className="py-3 text-sm text-right font-semibold"
                      style={{ color: currentTheme.text }}
                    >
                      ₹{item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              className="border-t pt-4 space-y-2"
              style={{ borderColor: currentTheme.border }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: currentTheme.textSecondary }}>
                  Subtotal
                </span>
                <span style={{ color: currentTheme.text }}>
                  ₹{cartSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: currentTheme.textSecondary }}>
                  Total Tax
                </span>
                <span style={{ color: currentTheme.text }}>
                  ₹{cartTotalTax.toFixed(2)}
                </span>
              </div>
              <div
                className="flex justify-between text-lg font-bold pt-2 border-t"
                style={{ borderColor: currentTheme.border }}
              >
                <span style={{ color: currentTheme.text }}>Grand Total</span>
                <span style={{ color: currentTheme.primary }}>
                  ₹{cartGrandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Final Checkout */}
        <div
          className="border-t px-6 py-4 flex justify-end gap-3"
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
          }}
        >
          <Button
            variant="outline"
            onClick={() => setShowInvoice(false)}
            style={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
            }}
          >
            Back
          </Button>
          <Button
            onClick={handleFinalCheckout}
            disabled={isProcessing}
            style={{ backgroundColor: "#10b981", color: "#fff" }}
          >
            {isProcessing ? "Processing..." : "Confirm Checkout"}
          </Button>
        </div>
      </div>
    );
  }

  // ===== SELL STOCKS MAIN VIEW =====
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
            style={{
              backgroundColor: currentTheme.primary,
              color: "#fff",
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1
            className="text-xl font-bold"
            style={{ color: currentTheme.text }}
          >
            Sell Stocks
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Product Selection */}
          <Card
            className="p-6"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: currentTheme.text }}
            >
              Select Product
            </h3>

            {/* 1. Product Name Dropdown with Search */}
            <div className="mb-4 relative" ref={dropdownRef}>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.textSecondary }}
              >
                Product Name
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: currentTheme.textSecondary }}
                />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) setSelectedRecordId("");
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-10"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>

              <AnimatePresence>
                {showDropdown && filteredProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-20 w-full mt-1 rounded-lg border shadow-lg max-h-48 overflow-auto"
                    style={{
                      backgroundColor: currentTheme.surface,
                      borderColor: currentTheme.border,
                    }}
                  >
                    {filteredProducts.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectProduct(r.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-all"
                        style={{
                          color: currentTheme.text,
                          backgroundColor:
                            selectedRecordId === r.id
                              ? `${currentTheme.primary}20`
                              : "transparent",
                        }}
                      >
                        <span className="font-medium">
                          {String(r.data[nameFieldId] || "Unnamed")}
                        </span>
                        <span
                          className="ml-2 text-xs"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          (Qty: {r.data[qtyFieldId] ?? "N/A"} | ₹
                          {r.data[priceFieldId] ?? "N/A"})
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Quantity */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.textSecondary }}
              >
                Quantity
              </label>
              <Input
                type="number"
                min={1}
                value={sellQty}
                onChange={(e) => setSellQty(Math.max(1, Number(e.target.value)))}
                disabled={!selectedRecordId}
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>

            {/* Computed Fields */}
            {selectedRecordId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {/* 3. Price */}
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme.textSecondary }}>
                    Price ({sellQty} × ₹{unitPrice.toFixed(2)})
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    ₹{price.toFixed(2)}
                  </span>
                </div>

                {/* 4. Tax */}
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme.textSecondary }}>
                    Tax ({taxPercent}%)
                    {!taxFieldId && (
                      <span className="text-xs ml-1">(default)</span>
                    )}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    ₹{taxAmount.toFixed(2)}
                  </span>
                </div>

                {/* 4. Total Price */}
                <div
                  className="flex justify-between text-sm pt-2 border-t"
                  style={{ borderColor: currentTheme.border }}
                >
                  <span
                    className="font-bold"
                    style={{ color: currentTheme.text }}
                  >
                    Total Price
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: currentTheme.primary }}
                  >
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* 5. Status */}
                <div className="flex items-center gap-2 mt-2">
                  {stockStatus === "in-stock" ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                      <Package className="w-3 h-3" /> In Stock (Available:{" "}
                      {effectiveAvailable})
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Out of Stock
                      (Available: {effectiveAvailable}, Requested: {sellQty})
                    </span>
                  )}
                </div>

                {/* 6/7. Action Buttons */}
                <div className="flex gap-3 mt-4">
                  {stockStatus === "out-of-stock" ? (
                    <Button
                      onClick={handleAddToOutOfStock}
                      className="flex-1"
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Out of Stock
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUploadToCart}
                      className="flex-1"
                      style={{
                        backgroundColor: "#10b981",
                        color: "#fff",
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </Card>

          {/* Right: Selected Items Cart */}
          <Card
            className="p-6"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{ color: currentTheme.text }}
              >
                <ShoppingCart className="w-5 h-5" />
                Selected Items ({selectedItems.length})
              </h3>
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart
                  className="w-12 h-12 mx-auto mb-3 opacity-30"
                  style={{ color: currentTheme.textSecondary }}
                />
                <p style={{ color: currentTheme.textSecondary }}>
                  No items added yet
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Select a product and add it to the cart
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-auto">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                    }}
                  >
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: currentTheme.text }}
                      >
                        {item.productName}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Qty: {item.qty} × ₹{item.unitPrice.toFixed(2)} | Tax:{" "}
                        {item.taxPercent}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: currentTheme.primary }}
                      >
                        ₹{item.totalPrice.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1 rounded hover:bg-red-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary */}
            {selectedItems.length > 0 && (
              <div
                className="mt-4 pt-4 border-t space-y-2"
                style={{ borderColor: currentTheme.border }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme.textSecondary }}>
                    Subtotal
                  </span>
                  <span style={{ color: currentTheme.text }}>
                    ₹{cartSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme.textSecondary }}>Tax</span>
                  <span style={{ color: currentTheme.text }}>
                    ₹{cartTotalTax.toFixed(2)}
                  </span>
                </div>
                <div
                  className="flex justify-between text-lg font-bold pt-2 border-t"
                  style={{ borderColor: currentTheme.border }}
                >
                  <span style={{ color: currentTheme.text }}>Total</span>
                  <span style={{ color: currentTheme.primary }}>
                    ₹{cartGrandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom: Check Invoice */}
      <div
        className="border-t px-6 py-4 flex justify-end"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <Button
          onClick={handleCheckInvoice}
          disabled={selectedItems.length === 0}
          style={{
            backgroundColor:
              selectedItems.length > 0 ? currentTheme.primary : `${currentTheme.primary}40`,
            color: selectedItems.length > 0 ? "#fff" : currentTheme.textSecondary,
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Check Invoice ({selectedItems.length} items)
        </Button>
      </div>
    </div>
  );
}
