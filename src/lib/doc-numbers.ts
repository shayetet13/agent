/** สร้างเลขเอกสารถัดไปแบบ sequential: {PREFIX}-{ปี}-{001}
 *  prefix เช่น "INV", "RC", "QT"
 *  existing คือ array ของเลขที่มีอยู่แล้ว (null/undefined ข้ามได้)
 */
export function nextDocNumber(
  existing: (string | null | undefined)[],
  prefix: string,
): string {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const nums = existing
    .filter((n): n is string => typeof n === "string" && n.startsWith(fullPrefix))
    .map((n) => parseInt(n.slice(fullPrefix.length), 10))
    .filter(Number.isFinite);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${fullPrefix}${String(next).padStart(3, "0")}`;
}
