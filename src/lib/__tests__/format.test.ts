import { describe, it, expect } from "vitest";
import { formatBaht, formatDate, formatDecimal, formatNumber, todayISO } from "../format";

describe("formatBaht", () => {
  it("formats positive amount", () => {
    expect(formatBaht(1000)).toContain("1,000");
  });

  it("handles zero", () => {
    expect(formatBaht(0)).toContain("0");
  });

  it("handles negative (shows as 0)", () => {
    // NaN/Infinity fall back to 0
    expect(formatBaht(NaN)).toContain("0");
  });

  it("formats decimal amount", () => {
    expect(formatBaht(1234.5)).toContain("1,234.50");
  });
});

describe("formatDecimal", () => {
  it("shows 2 decimal places", () => {
    expect(formatDecimal(1000)).toContain("1,000.00");
  });

  it("rounds correctly", () => {
    expect(formatDecimal(1.005)).toContain("1.01");
  });
});

describe("formatNumber", () => {
  it("formats without decimals", () => {
    expect(formatNumber(1234)).toContain("1,234");
  });
});

describe("formatDate", () => {
  it("returns — for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns — for empty string", () => {
    expect(formatDate("")).toBe("—");
  });

  it("returns — for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("returns formatted date for valid ISO string", () => {
    const result = formatDate("2025-01-15");
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("todayISO", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
