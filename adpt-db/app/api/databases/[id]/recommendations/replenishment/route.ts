import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { DatabaseModel } from "@/lib/models/Database";
import {
  generateReplenishmentRecommendations,
  IncomingReplenishment,
  ReplenishmentItem,
} from "@/lib/replenishment-recommender";

type RecommenderRequestBody = {
  stockFieldId: string;
  salesHistoryFieldId?: string;
  salesHistoryOverrides?: Record<string, number[] | string | number>;
  skuFieldId?: string;
  nameFieldId?: string;
  reorderPointFieldId?: string;
  leadTimeDaysFieldId?: string;
  safetyStockDaysFieldId?: string;
  incomingReplenishmentFieldId?: string;
  forecastDays?: number;
  defaultLeadTimeDays?: number;
  defaultSafetyStockDays?: number;
  topN?: number;
  search?: string;
  date?: string;
};

const toNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSalesHistory = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => toNumber(entry))
      .filter((entry): entry is number => entry !== null)
      .map((entry) => (entry < 0 ? 0 : entry));
  }

  if (typeof value === "number") {
    return [value < 0 ? 0 : value];
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => toNumber(entry.trim()))
      .filter((entry): entry is number => entry !== null)
      .map((entry) => (entry < 0 ? 0 : entry));
  }

  return [];
};

const parseIncomingReplenishments = (
  value: unknown
): IncomingReplenishment[] => {
  if (typeof value === "number") {
    return [{ quantity: Math.max(0, value), etaDate: new Date().toISOString() }];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const objectEntry = entry as Record<string, unknown>;
        const quantity = toNumber(objectEntry.quantity);
        const etaDate =
          typeof objectEntry.etaDate === "string" ? objectEntry.etaDate : null;
        if (quantity === null || !etaDate) return null;
        return {
          quantity: Math.max(0, quantity),
          etaDate,
        };
      })
      .filter((entry): entry is IncomingReplenishment => entry !== null);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    const directNumber = toNumber(trimmed);
    if (directNumber !== null) {
      return [
        {
          quantity: Math.max(0, directNumber),
          etaDate: new Date().toISOString(),
        },
      ];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return parseIncomingReplenishments(parsed);
    } catch {
      return [];
    }
  }

  return [];
};

const getOverrideSalesHistory = (
  body: RecommenderRequestBody,
  data: Record<string, unknown>,
  recordId: string
): number[] => {
  if (!body.salesHistoryOverrides) return [];

  const keys: string[] = [];
  if (recordId) keys.push(recordId);

  if (body.skuFieldId && typeof data[body.skuFieldId] === "string") {
    const sku = (data[body.skuFieldId] as string).trim();
    if (sku) keys.push(sku);
  }

  if (body.nameFieldId && typeof data[body.nameFieldId] === "string") {
    const name = (data[body.nameFieldId] as string).trim();
    if (name) keys.push(name, name.toLowerCase());
  }

  for (const key of keys) {
    const overrideValue = body.salesHistoryOverrides[key];
    if (overrideValue === undefined) continue;

    const parsed = parseSalesHistory(overrideValue);
    if (parsed.length) {
      return parsed;
    }
  }

  return [];
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RecommenderRequestBody;
    const hasOverrides =
      !!body.salesHistoryOverrides &&
      Object.keys(body.salesHistoryOverrides).length > 0;

    if (!body.stockFieldId || (!body.salesHistoryFieldId && !hasOverrides)) {
      return NextResponse.json(
        {
          error:
            "stockFieldId and either salesHistoryFieldId or salesHistoryOverrides are required to generate recommendations.",
        },
        { status: 400 }
      );
    }

    const databaseId = (await params).id;
    const database = await DatabaseModel.findOne({
      _id: databaseId,
      clerkId: userId,
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found." }, { status: 404 });
    }

    const warnings: string[] = [];
    const items: ReplenishmentItem[] = [];

    // Apply the same filters as the records list so recommendations match the visible data
    let filteredRecords = [...database.records];

    if (body.date) {
      const dateQuery = body.date;
      const dateFieldIds = (database.formSchema || [])
        .filter((f: any) => f.type === 'date-picker')
        .map((f: any) => f.id);

      filteredRecords = filteredRecords.filter((r: any) => {
        // Check createdAt
        if (r.createdAt) {
          const d = new Date(r.createdAt);
          if (!isNaN(d.getTime())) {
            const recordLocalDate = d.toLocaleDateString('en-CA', {
              timeZone: 'Asia/Kolkata',
            });
            if (recordLocalDate === dateQuery) return true;
          }
        }
        // Check user-defined date columns
        if (r.data && dateFieldIds.length > 0) {
          for (const fieldId of dateFieldIds) {
            const val = r.data[fieldId];
            if (!val) continue;
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) {
              const localDate = parsed.toLocaleDateString('en-CA', {
                timeZone: 'Asia/Kolkata',
              });
              if (localDate === dateQuery) return true;
            }
            if (typeof val === 'string' && val.slice(0, 10) === dateQuery) return true;
          }
        }
        return false;
      });
    }

    if (body.search) {
      const s = body.search.toLowerCase();
      filteredRecords = filteredRecords.filter((r: any) =>
        r.data && Object.values(r.data).some((val: unknown) =>
          String(val || "").toLowerCase().includes(s)
        )
      );
    }

    filteredRecords.forEach(
      (
        record: {
          id?: string;
          data?: Record<string, unknown>;
        },
        index: number
      ) => {
        const data = record.data || {};

        const currentStock = toNumber(data[body.stockFieldId]);
        if (currentStock === null) {
          warnings.push(
            `Record ${index + 1} skipped: "${body.stockFieldId}" is missing or not numeric.`
          );
          return;
        }

        const directSalesHistory = body.salesHistoryFieldId
          ? parseSalesHistory(data[body.salesHistoryFieldId])
          : [];
        const overrideSalesHistory = getOverrideSalesHistory(
          body,
          data,
          record.id || ""
        );
        const salesHistory = directSalesHistory.length
          ? directSalesHistory
          : overrideSalesHistory;

        if (!salesHistory.length) {
          const salesSource = body.salesHistoryFieldId
            ? `"${body.salesHistoryFieldId}"`
            : "salesHistoryOverrides";
          warnings.push(
            `Record ${index + 1} skipped: ${salesSource} has no usable sales history.`
          );
          return;
        }

        const skuFromField: string | null =
          body.skuFieldId && typeof data[body.skuFieldId] === "string"
            ? (data[body.skuFieldId] as string)
            : null;
        const nameFromField: string | undefined =
          body.nameFieldId && typeof data[body.nameFieldId] === "string"
            ? (data[body.nameFieldId] as string)
            : undefined;
        const sku =
          typeof skuFromField === "string" && skuFromField
            ? skuFromField
            : typeof record.id === "string" && record.id
              ? record.id
              : `SKU-${index + 1}`;
        const name =
          typeof nameFromField === "string" ? nameFromField : undefined;

        const item: ReplenishmentItem = {
          sku,
          name,
          currentStock,
          salesHistory,
        };

        if (body.reorderPointFieldId) {
          const reorderPoint = toNumber(data[body.reorderPointFieldId]);
          if (reorderPoint !== null) item.reorderPoint = reorderPoint;
        }

        if (body.leadTimeDaysFieldId) {
          const leadTimeDays = toNumber(data[body.leadTimeDaysFieldId]);
          if (leadTimeDays !== null) item.leadTimeDays = leadTimeDays;
        }

        if (body.safetyStockDaysFieldId) {
          const safetyStockDays = toNumber(data[body.safetyStockDaysFieldId]);
          if (safetyStockDays !== null) item.safetyStockDays = safetyStockDays;
        }

        if (body.incomingReplenishmentFieldId) {
          item.incomingReplenishments = parseIncomingReplenishments(
            data[body.incomingReplenishmentFieldId]
          );
        }

        items.push(item);
      }
    );

    if (!items.length) {
      return NextResponse.json(
        {
          error: "No valid records found for recommendation generation.",
          warnings,
        },
        { status: 400 }
      );
    }

    const result = generateReplenishmentRecommendations(items, {
      forecastDays: body.forecastDays,
      defaultLeadTimeDays: body.defaultLeadTimeDays,
      defaultSafetyStockDays: body.defaultSafetyStockDays,
    });

    const topN =
      typeof body.topN === "number" && body.topN > 0
        ? Math.floor(body.topN)
        : null;

    return NextResponse.json({
      ...result,
      recommendations: topN
        ? result.recommendations.slice(0, topN)
        : result.recommendations,
      warnings,
      meta: {
        databaseId,
        totalRecords: filteredRecords.length,
        validRecordsUsed: items.length,
      },
    });
  } catch (error) {
    console.error("Replenishment recommender error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}
