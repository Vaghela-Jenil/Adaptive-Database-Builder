export type IncomingReplenishment = {
  quantity: number;
  etaDate: string;
};

export type ReplenishmentItem = {
  sku: string;
  name?: string;
  currentStock: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  safetyStockDays?: number;
  salesHistory: number[];
  incomingReplenishments?: IncomingReplenishment[];
};

export type RecommenderConfig = {
  forecastDays?: number;
  defaultLeadTimeDays?: number;
  defaultSafetyStockDays?: number;
  overstockMultiplier?: number;
};

export type ReplenishmentRecommendation = {
  sku: string;
  name?: string;
  action: "order_now" | "order_soon" | "healthy" | "overstock";
  urgencyScore: number;
  recommendedOrderQty: number;
  predictedDailySales: number;
  predictedHorizonDemand: number;
  daysUntilStockout: number;
  projectedStockAtHorizon: number;
  leadTimeDays: number;
  safetyStockUnits: number;
  explanation: string;
};

export type RecommenderResult = {
  generatedAt: string;
  forecastDays: number;
  summary: {
    totalSkus: number;
    orderNowCount: number;
    orderSoonCount: number;
    healthyCount: number;
    overstockCount: number;
    totalRecommendedUnits: number;
  };
  recommendations: ReplenishmentRecommendation[];
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNonNegative = (value: number): number => (value < 0 ? 0 : value);

const weightedMovingAverage = (series: number[]): number => {
  if (!series.length) return 0;
  const window = series.slice(-14).map((value) => clampNonNegative(toFiniteNumber(value)));
  const totalWeight = window.reduce((sum, _value, index) => sum + (index + 1), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = window.reduce(
    (sum, value, index) => sum + value * (index + 1),
    0
  );
  return weightedSum / totalWeight;
};

const linearTrendSlope = (series: number[]): number => {
  const clean = series
    .slice(-30)
    .map((value) => clampNonNegative(toFiniteNumber(value)));

  if (clean.length < 2) return 0;

  const n = clean.length;
  const xMean = (n - 1) / 2;
  const yMean = clean.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    const xDiff = i - xMean;
    numerator += xDiff * (clean[i] - yMean);
    denominator += xDiff * xDiff;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
};

const incomingWithinDays = (
  incoming: IncomingReplenishment[],
  referenceDate: Date,
  days: number
): number => {
  const maxTime = referenceDate.getTime() + days * 24 * 60 * 60 * 1000;
  return incoming.reduce((sum, entry) => {
    const eta = new Date(entry.etaDate).getTime();
    if (!Number.isFinite(eta)) return sum;
    if (eta <= maxTime) return sum + clampNonNegative(toFiniteNumber(entry.quantity));
    return sum;
  }, 0);
};

const buildExplanation = (
  action: ReplenishmentRecommendation["action"],
  recommendation: ReplenishmentRecommendation
): string => {
  if (action === "order_now") {
    return `Expected stockout in ${recommendation.daysUntilStockout.toFixed(
      1
    )} days. Place order immediately for ${recommendation.recommendedOrderQty} units.`;
  }
  if (action === "order_soon") {
    return `Demand trend suggests low cover soon. Prepare replenishment of ${recommendation.recommendedOrderQty} units.`;
  }
  if (action === "overstock") {
    return "Current coverage is significantly above forecast demand. Delay replenishment.";
  }
  return "Stock level is healthy for predicted demand and lead time.";
};

export const generateReplenishmentRecommendations = (
  items: ReplenishmentItem[],
  config: RecommenderConfig = {}
): RecommenderResult => {
  const now = new Date();
  const forecastDays = Math.max(1, Math.floor(toFiniteNumber(config.forecastDays, 14)));
  const defaultLeadTimeDays = Math.max(
    1,
    Math.floor(toFiniteNumber(config.defaultLeadTimeDays, 7))
  );
  const defaultSafetyStockDays = Math.max(
    0,
    Math.floor(toFiniteNumber(config.defaultSafetyStockDays, 3))
  );
  const overstockMultiplier = Math.max(
    1.1,
    toFiniteNumber(config.overstockMultiplier, 2)
  );

  const recommendations = items.map((item) => {
    const leadTimeDays = Math.max(
      1,
      Math.floor(toFiniteNumber(item.leadTimeDays, defaultLeadTimeDays))
    );
    const salesHistory = (item.salesHistory || []).map((value) =>
      clampNonNegative(toFiniteNumber(value))
    );
    const incoming = item.incomingReplenishments || [];
    const currentStock = clampNonNegative(toFiniteNumber(item.currentStock));

    // Blend short-term weighted average with long-term trend to forecast near-future demand.
    const baseDemand = weightedMovingAverage(salesHistory);
    const trendSlope = linearTrendSlope(salesHistory);
    const trendAdjusted = baseDemand + trendSlope * Math.min(14, forecastDays) * 0.5;
    const predictedDailySales = Math.max(0.01, trendAdjusted);

    const safetyStockDays = Math.max(
      0,
      Math.floor(toFiniteNumber(item.safetyStockDays, defaultSafetyStockDays))
    );
    const safetyStockUnits = Math.ceil(predictedDailySales * safetyStockDays);

    const incomingByLead = incomingWithinDays(incoming, now, leadTimeDays);
    const incomingByHorizon = incomingWithinDays(incoming, now, forecastDays);

    const targetStockAtLeadArrival = Math.ceil(
      predictedDailySales * leadTimeDays + safetyStockUnits
    );
    const availableAtLeadArrival = currentStock + incomingByLead;
    const recommendedOrderQty = Math.max(
      0,
      Math.ceil(targetStockAtLeadArrival - availableAtLeadArrival)
    );

    const predictedHorizonDemand = predictedDailySales * forecastDays;
    const projectedStockAtHorizon = Math.floor(
      currentStock + incomingByHorizon - predictedHorizonDemand
    );
    const daysUntilStockout = currentStock / predictedDailySales;
    const reorderPoint = toFiniteNumber(item.reorderPoint, safetyStockUnits);

    const immediateRisk = daysUntilStockout <= leadTimeDays || currentStock <= reorderPoint;
    const soonRisk = daysUntilStockout <= leadTimeDays + safetyStockDays + 2;
    const veryHighCover = currentStock > predictedDailySales * (leadTimeDays + forecastDays) * overstockMultiplier;

    let action: ReplenishmentRecommendation["action"] = "healthy";
    if (recommendedOrderQty > 0 && immediateRisk) {
      action = "order_now";
    } else if (recommendedOrderQty > 0 && soonRisk) {
      action = "order_soon";
    } else if (veryHighCover) {
      action = "overstock";
    }

    let urgencyScore = 20;
    if (action === "order_now") urgencyScore = 100;
    if (action === "order_soon") urgencyScore = 70;
    if (action === "overstock") urgencyScore = 10;

    if (Number.isFinite(daysUntilStockout)) {
      urgencyScore += Math.max(0, Math.round((leadTimeDays - daysUntilStockout) * 4));
    }
    urgencyScore = Math.max(0, Math.min(100, urgencyScore));

    const recommendation: ReplenishmentRecommendation = {
      sku: item.sku,
      name: item.name,
      action,
      urgencyScore,
      recommendedOrderQty,
      predictedDailySales: Number(predictedDailySales.toFixed(2)),
      predictedHorizonDemand: Number(predictedHorizonDemand.toFixed(2)),
      daysUntilStockout: Number(daysUntilStockout.toFixed(2)),
      projectedStockAtHorizon,
      leadTimeDays,
      safetyStockUnits,
      explanation: "",
    };

    recommendation.explanation = buildExplanation(action, recommendation);
    return recommendation;
  });

  recommendations.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const summary = recommendations.reduce(
    (acc, recommendation) => {
      if (recommendation.action === "order_now") acc.orderNowCount += 1;
      if (recommendation.action === "order_soon") acc.orderSoonCount += 1;
      if (recommendation.action === "healthy") acc.healthyCount += 1;
      if (recommendation.action === "overstock") acc.overstockCount += 1;
      acc.totalRecommendedUnits += recommendation.recommendedOrderQty;
      return acc;
    },
    {
      totalSkus: recommendations.length,
      orderNowCount: 0,
      orderSoonCount: 0,
      healthyCount: 0,
      overstockCount: 0,
      totalRecommendedUnits: 0,
    }
  );

  return {
    generatedAt: now.toISOString(),
    forecastDays,
    summary,
    recommendations,
  };
};
