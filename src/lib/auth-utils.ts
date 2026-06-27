// ⚠️ ต้องตรงกับ email domain ของ Supabase Auth users (ดู auth.admin.listUsers)
// ไม่ใช่ domain แบรนด์ — เป็นแค่ internal namespace สำหรับแปลง username → email
const LOGIN_DOMAIN = "stacka7.co.th";

export function usernameToEmail(username: string): string {
  return `${username}@${LOGIN_DOMAIN}`;
}
