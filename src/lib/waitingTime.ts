import { OrderData } from "@/types";

/**
 * Base preparation times (minutes) per menu category.
 * Kitchen sections are modelled as parallel queues — the slowest section
 * in a given order determines the overall ETA.
 *
 * Add / override categories here to tune timings for a specific hotel.
 */
export const CATEGORY_PREP_TIMES: Record<string, number> = {
  // ── Instant / Quick ───────────────────────────────────────────
  "Water":        1,
  "Cold Drinks":  2,
  "Soft Drinks":  2,
  "Juices":       3,
  "Juice":        3,
  "Beverages":    3,
  "Tea":          3,
  "Coffee":       4,
  "Drinks":       3,

  // ── Snacks / Light ────────────────────────────────────────────
  "Snacks":       4,
  "Starters":     7,
  "Appetizers":   7,
  "Soups":        6,
  "Salads":       5,
  "Sandwiches":   5,
  "Burgers":      8,
  "Wraps":        6,
  "Rolls":        6,

  // ── Medium ────────────────────────────────────────────────────
  "Pasta":        10,
  "Noodles":      8,
  "Noodle":       8,
  "Breads":       8,
  "Bread":        8,
  "Roti":         6,
  "Paratha":      7,

  // ── Mains ─────────────────────────────────────────────────────
  "Rice":         10,
  "Biryani":      15,
  "Main Course":  12,
  "Mains":        12,
  "Curry":        12,
  "Gravy":        12,
  "Dal":          10,
  "Chicken":      10,
  "Mutton":       15,
  "Seafood":      12,
  "Fish":         10,
  "Paneer":       10,
  "Veg":          10,
  "Pizza":        12,

  // ── Desserts ──────────────────────────────────────────────────
  "Ice Cream":    3,
  "Desserts":     5,
  "Sweets":       5,
};

const DEFAULT_PREP_TIME = 8; // minutes for unmapped categories

/** Resolve category → prep time (case-insensitive partial match fallback) */
export function getPrepTime(category: string): number {
  // Exact match
  if (CATEGORY_PREP_TIMES[category] !== undefined) {
    return CATEGORY_PREP_TIMES[category];
  }
  // Case-insensitive exact
  const lower = category.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_PREP_TIMES)) {
    if (key.toLowerCase() === lower) return val;
  }
  // Substring match (e.g. "Chilly Chicken" → "Chicken")
  for (const [key, val] of Object.entries(CATEGORY_PREP_TIMES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  return DEFAULT_PREP_TIME;
}

/** Minutes elapsed since the given ISO timestamp */
function elapsedMins(createdAt: string): number {
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 60_000);
}

/**
 * Estimate how many more minutes `targetOrder` will take before it is ready.
 *
 * Algorithm (per-category queue model):
 *  For each category present in targetOrder's items:
 *    1. Find all PENDING/PREPARING orders placed *before* targetOrder that
 *       also contain items from the same category ("same kitchen section").
 *    2. For each such order, compute remaining time =
 *         max(0, prepTime − elapsed)          [PENDING]
 *         max(0, prepTime × 0.5 − elapsed)    [PREPARING — already started]
 *    3. categoryWait = Σ remaining + own prepTime
 *  Return max(categoryWait across all categories, MIN_WAIT).
 *
 * @param targetOrder    The order whose ETA we are estimating
 * @param allOrders      All active (PENDING/PREPARING) orders in the org
 * @param categoryMap    menuItemId → category  (from the menu items list)
 */
export function estimateWaitMins(
  targetOrder: OrderData,
  allOrders: OrderData[],
  categoryMap: Record<string, string>
): number {
  const MIN_WAIT = 4;

  if (
    targetOrder.status === "DONE" ||
    targetOrder.status === "CANCELLED" ||
    targetOrder.status === "READY"
  ) {
    return 0;
  }

  // Categories present in this order and their base prep times
  const ownCategories = new Map<string, number>();
  for (const item of targetOrder.items) {
    const cat = categoryMap[item.menuItemId] ?? "default";
    if (!ownCategories.has(cat)) {
      ownCategories.set(cat, getPrepTime(cat));
    }
  }

  if (ownCategories.size === 0) return MIN_WAIT;

  // Build a set of menuItemIds → category for quick lookup inside other orders
  function getOrderCategories(order: OrderData): Set<string> {
    const cats = new Set<string>();
    for (const item of order.items) {
      const cat = categoryMap[item.menuItemId];
      if (cat) cats.add(cat);
    }
    return cats;
  }

  const targetTime = new Date(targetOrder.createdAt).getTime();

  let maxWait = 0;

  for (const [cat, prepTime] of ownCategories) {
    // Orders in the same category placed BEFORE targetOrder (already in queue)
    const predecessors = allOrders.filter((o) => {
      if (o.id === targetOrder.id) return false;
      if (o.status === "DONE" || o.status === "CANCELLED") return false;
      if (new Date(o.createdAt).getTime() >= targetTime) return false;
      return getOrderCategories(o).has(cat);
    });

    let queueWait = 0;
    for (const pred of predecessors) {
      const elapsed = elapsedMins(pred.createdAt);
      if (pred.status === "PREPARING") {
        // Already cooking — roughly halfway through
        queueWait += Math.max(0, prepTime * 0.5 - elapsed);
      } else {
        // Still pending — full remaining time
        queueWait += Math.max(0, prepTime - elapsed);
      }
    }

    const categoryWait = queueWait + prepTime;
    if (categoryWait > maxWait) maxWait = categoryWait;
  }

  // If order is PREPARING it's already on the stove — subtract elapsed time
  if (targetOrder.status === "PREPARING") {
    const elapsed = elapsedMins(targetOrder.createdAt);
    maxWait = Math.max(0, maxWait - elapsed);
  }

  return Math.max(MIN_WAIT, Math.round(maxWait));
}

/** Human-readable label: "~4 mins", "~12 mins", "< 1 min" */
export function formatWait(mins: number): string {
  if (mins <= 0) return "< 1 min";
  if (mins === 1) return "~1 min";
  return `~${mins} mins`;
}
