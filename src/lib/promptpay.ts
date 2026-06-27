/** CRC16-CCITT (XModem variant) */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** EMVCo TLV field: TAG (2) + LENGTH (2) + VALUE */
function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

/**
 * สร้าง PromptPay QR string ตามมาตรฐาน EMVCo ของไทย
 * @param input เบอร์โทรศัพท์ (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก)
 * @param amount จำนวนเงิน (optional)
 */
export function promptPayQRString(input: string, amount?: number): string {
  const digits = input.replace(/\D/g, "");

  let normalized: string;
  if (digits.length === 13) {
    // เลขบัตรประชาชน — ใช้ตรงๆ
    normalized = digits;
  } else {
    // เบอร์โทรศัพท์: 0XXXXXXXXX → 0066XXXXXXXXX
    normalized = `0066${digits.startsWith("0") ? digits.slice(1) : digits}`;
  }

  const accountTag = digits.length === 13 ? "02" : "01"; // 02 = national ID, 01 = mobile
  const merchantAccInfo =
    tlv("00", "A000000677010111") +
    tlv(accountTag, normalized);

  let payload =
    tlv("00", "01") +            // Payload Format Indicator
    tlv("01", "12") +            // Dynamic QR
    tlv("29", merchantAccInfo) + // Merchant Account Info
    tlv("53", "764");            // Currency: THB

  if (amount && amount > 0) {
    payload += tlv("54", amount.toFixed(2));
  }

  payload +=
    tlv("58", "TH") +      // Country Code
    tlv("59", "N/A") +     // Merchant Name
    tlv("60", "Bangkok") + // Merchant City
    "6304";                // CRC placeholder (tag + len, value follows)

  return payload + crc16(payload);
}
