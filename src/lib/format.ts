// ฟอร์แมตเงินบาทและวันที่ (ไทย)

const bahtFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});

export function formatBaht(amount: number): string {
  return bahtFormatter.format(Number.isFinite(amount) ? amount : 0);
}

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateFormatterLong = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/** วันที่แบบเดือนเต็ม สำหรับเอกสาร เช่น "22 มิถุนายน 2568" */
export function formatDateLong(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatterLong.format(date);
}

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** วันที่ + เวลา เช่น "22 มิ.ย. 2568 14:30" */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

/** ตัวเลขแบบไทย ไม่มีทศนิยม เช่น 1,234 */
export function formatNumber(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

/** ตัวเลขแบบไทย 2 ทศนิยม ไม่มีสัญลักษณ์บาท เช่น 1,234.50 */
export function formatDecimal(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** วันที่วันนี้ในรูปแบบ YYYY-MM-DD (ตาม local) สำหรับ default ของ input[type=date] */
export function todayISO(): string {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}
