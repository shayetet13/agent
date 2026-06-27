import { describe, expect, it } from "vitest";
import { calculateCommission } from "./commission";

describe("calculateCommission", () => {
  it("คืนยอดคงที่เมื่อ type = fixed (ไม่สนใจ basis/ยอดเงิน)", () => {
    expect(
      calculateCommission({
        commissionType: "fixed",
        commissionValue: 2000,
        quotedAmount: 50000,
        firstPaymentAmount: 25000,
        commissionBasis: "first_payment",
      }),
    ).toBe(2000);
  });

  it("คำนวณ % ของยอดเงินก้อนแรก เมื่อ basis = first_payment", () => {
    expect(
      calculateCommission({
        commissionType: "percent",
        commissionValue: 10,
        quotedAmount: 50000,
        firstPaymentAmount: 25000,
        commissionBasis: "first_payment",
      }),
    ).toBe(2500);
  });

  it("คำนวณ % ของยอดเสนอราคารวม เมื่อ basis = total_quote", () => {
    expect(
      calculateCommission({
        commissionType: "percent",
        commissionValue: 15,
        quotedAmount: 50000,
        firstPaymentAmount: 25000,
        commissionBasis: "total_quote",
      }),
    ).toBe(7500);
  });

  it("ปัดทศนิยม 2 ตำแหน่ง", () => {
    expect(
      calculateCommission({
        commissionType: "percent",
        commissionValue: 12.5,
        quotedAmount: 0,
        firstPaymentAmount: 333.33,
        commissionBasis: "first_payment",
      }),
    ).toBe(41.67);
  });

  it("กันค่าติดลบ/NaN → คืน 0", () => {
    expect(
      calculateCommission({
        commissionType: "percent",
        commissionValue: Number.NaN,
        quotedAmount: 1000,
        firstPaymentAmount: 1000,
        commissionBasis: "total_quote",
      }),
    ).toBe(0);

    expect(
      calculateCommission({
        commissionType: "fixed",
        commissionValue: -500,
        quotedAmount: 0,
        firstPaymentAmount: 0,
        commissionBasis: "first_payment",
      }),
    ).toBe(0);
  });
});
