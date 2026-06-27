import type { CommissionBasis, CommissionType } from "./types";

export interface CommissionInput {
  commissionType: CommissionType;
  commissionValue: number;
  /** ใช้เมื่อ commissionType = 'percent' และ basis = 'total_quote' */
  quotedAmount: number;
  /** ใช้เมื่อ commissionType = 'percent' และ basis = 'first_payment' */
  firstPaymentAmount: number;
  commissionBasis: CommissionBasis;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * คำนวณค่าคอมของดีลหนึ่งดีล
 * - fixed: คืนยอดคงที่ตามที่ตั้งไว้
 * - percent + first_payment: %  ของยอดเงินก้อนแรก
 * - percent + total_quote:   %  ของยอดเสนอราคารวม
 */
export function calculateCommission(input: CommissionInput): number {
  const value = Number.isFinite(input.commissionValue) ? input.commissionValue : 0;

  if (input.commissionType === "fixed") {
    return round2(Math.max(0, value));
  }

  const base =
    input.commissionBasis === "first_payment"
      ? input.firstPaymentAmount
      : input.quotedAmount;

  return round2(Math.max(0, (value / 100) * Math.max(0, base || 0)));
}
