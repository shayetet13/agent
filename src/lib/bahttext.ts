// แปลงจำนวนเงินเป็นข้อความภาษาไทย (เช่น 1,500.50 → "หนึ่งพันห้าร้อยบาทห้าสิบสตางค์")
// ใช้สำหรับใบเสร็จรับเงินตามรูปแบบเอกสารราชการไทย

const TH_DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const TH_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/** อ่านกลุ่มตัวเลขไม่เกิน 6 หลัก (น้อยกว่าหนึ่งล้าน) */
function readChunk(numStr: string): string {
  let result = "";
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10);
    const pos = len - i - 1; // ตำแหน่งจากขวา (หลักหน่วย = 0)
    if (digit === 0) continue;
    if (pos === 0 && digit === 1 && len > 1) {
      result += "เอ็ด";
    } else if (pos === 1 && digit === 2) {
      result += "ยี่" + TH_PLACES[pos];
    } else if (pos === 1 && digit === 1) {
      result += TH_PLACES[pos];
    } else {
      result += TH_DIGITS[digit] + TH_PLACES[pos];
    }
  }
  return result;
}

/** อ่านจำนวนเต็มเป็นข้อความไทย (รองรับหลักล้าน) */
function readNumber(n: number): string {
  if (n === 0) return "";
  const s = String(n);
  if (s.length > 6) {
    const millions = s.slice(0, s.length - 6);
    const rest = s.slice(s.length - 6);
    return readNumber(parseInt(millions, 10)) + "ล้าน" + readChunk(rest);
  }
  return readChunk(s);
}

/** แปลงจำนวนเงินบาทเป็นข้อความเต็มตามรูปแบบใบเสร็จไทย */
export function bahtText(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const num = Math.abs(amount);
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);

  if (baht === 0 && satang === 0) return "ศูนย์บาทถ้วน";

  let text = "";
  if (baht > 0) text += readNumber(baht) + "บาท";
  text += satang > 0 ? readNumber(satang) + "สตางค์" : "ถ้วน";
  return text;
}
