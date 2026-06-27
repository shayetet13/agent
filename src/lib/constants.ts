// Single source of truth สำหรับข้อมูลบริษัทและสีของเอกสาร (ใบเสร็จ/ใบแจ้งหนี้/ใบเสนอราคา)
// อย่า hardcode ข้อมูลเหล่านี้ซ้ำในแต่ละหน้า — import จากที่นี่เสมอ

/** ข้อมูลผู้ออกเอกสาร (บริษัท) */
export const COMPANY = {
  name: "STACKA7",
  subname: "สแตคก้าเซเว่น",
  tagline: "รับออกแบบและพัฒนาเว็บไซต์ · เว็บแอปพลิเคชัน · ระบบซอฟต์แวร์",
  dev: "เก๊า",
  role: "Developer",
  email: "support@stacka7.io",
  website: "stacka7.io",
} as const;

// ── สีแบรนด์สำหรับเอกสารตระกูลใบเสร็จ (ส้ม → ชมพู ตามโลโก้) ──
export const DOC_INK = "#16181d";
export const DOC_ORANGE = "#ff6a1a";
export const DOC_MAGENTA = "#ff2e63";
export const DOC_GRADIENT = `linear-gradient(90deg, ${DOC_ORANGE} 0%, ${DOC_MAGENTA} 100%)`;

/** className ของ label เล็กตัวพิมพ์ใหญ่ในเอกสาร */
export const DOC_LABEL_CLS = "text-[12px] font-semibold uppercase tracking-[0.18em] text-zinc-400";
