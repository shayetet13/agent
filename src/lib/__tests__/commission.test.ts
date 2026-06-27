import { describe, it, expect } from "vitest";

// Commission calculation logic (extracted from deals.ts addPayment)
function calcCommission(
  quotedAmount: number,
  paymentAmount: number,
  commissionValue: number,
): number {
  const base = quotedAmount > 0 ? quotedAmount : paymentAmount;
  return Math.round((base * commissionValue) / 100 * 100) / 100;
}

describe("calcCommission", () => {
  it("uses quotedAmount when available", () => {
    expect(calcCommission(100_000, 30_000, 10)).toBe(10_000);
  });

  it("falls back to paymentAmount when quotedAmount is 0", () => {
    expect(calcCommission(0, 50_000, 10)).toBe(5_000);
  });

  it("handles 0% commission", () => {
    expect(calcCommission(100_000, 30_000, 0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // 100_001 * 10% = 10_000.1 → 10_000.10
    expect(calcCommission(100_001, 0, 10)).toBe(10_000.10);
  });

  it("handles fractional commission rate", () => {
    expect(calcCommission(100_000, 0, 7.5)).toBe(7_500);
  });
});

// Lead status transition validation
type LeadStatus = "new" | "read" | "contacted" | "converted" | "rejected";

function canTransitionTo(current: LeadStatus, next: LeadStatus): boolean {
  const allowed: Record<LeadStatus, LeadStatus[]> = {
    new:       ["read"],
    read:      ["contacted", "converted", "rejected"],
    contacted: ["converted", "rejected"],
    converted: [],
    rejected:  [],
  };
  return allowed[current].includes(next);
}

describe("lead status transitions", () => {
  it("new → read is allowed", () => {
    expect(canTransitionTo("new", "read")).toBe(true);
  });

  it("read → contacted is allowed", () => {
    expect(canTransitionTo("read", "contacted")).toBe(true);
  });

  it("read → converted is allowed", () => {
    expect(canTransitionTo("read", "converted")).toBe(true);
  });

  it("contacted → converted is allowed", () => {
    expect(canTransitionTo("contacted", "converted")).toBe(true);
  });

  it("converted → anything is blocked (terminal state)", () => {
    expect(canTransitionTo("converted", "rejected")).toBe(false);
    expect(canTransitionTo("converted", "contacted")).toBe(false);
  });

  it("rejected → anything is blocked (terminal state)", () => {
    expect(canTransitionTo("rejected", "converted")).toBe(false);
    expect(canTransitionTo("rejected", "contacted")).toBe(false);
  });

  it("new → converted is not directly allowed", () => {
    expect(canTransitionTo("new", "converted")).toBe(false);
  });
});

// Invoice number format
function invoiceNo(dealId: string, createdAt: string): string {
  const d = new Date(createdAt);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV${ymd}-${dealId.slice(-5).toUpperCase()}`;
}

describe("invoiceNo", () => {
  it("generates correct format", () => {
    const result = invoiceNo("abc123xyz", "2025-06-23T00:00:00Z");
    expect(result).toMatch(/^INV\d{8}-[A-Z0-9]{5}$/);
    expect(result).toContain("3XYZ");
  });

  it("uses last 5 chars of dealId uppercased", () => {
    const result = invoiceNo("deal-abcde", "2025-01-01T00:00:00Z");
    expect(result.endsWith("ABCDE")).toBe(true);
  });
});
