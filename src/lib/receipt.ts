// เลขที่ใบเสร็จ — คำนวณจาก payout id + วันที่จ่าย (ไม่ได้เก็บใน DB)
// รูปแบบ: RC{YYYYMMDD}-{5 ตัวท้ายของ id ตัวพิมพ์ใหญ่} เช่น RC20260620-84WRL

export function receiptNo(id: string, paidAt: string | null): string {
  const datePart = (paidAt ?? new Date().toISOString()).slice(0, 10).replace(/-/g, "");
  return `RC${datePart}-${id.slice(-5).toUpperCase()}`;
}

// ใบเสร็จรับเงินลูกค้า — รูปแบบ: CR{YYYYMMDD}-{5 ตัวท้ายของ dealId}
export function customerReceiptNo(dealId: string, firstPaymentDate: string | null): string {
  const datePart = (firstPaymentDate ?? new Date().toISOString()).slice(0, 10).replace(/-/g, "");
  return `CR${datePart}-${dealId.slice(-5).toUpperCase()}`;
}
