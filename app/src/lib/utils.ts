/**
 * Derive display name: "First L." from full name "First Last"
 */
export function shortDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Derive username from display name: "vinh.phan" from "Vinh Phan"
 */
export function deriveUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".");
}

/**
 * Generate a 6-character session code (uppercase alphanumeric, no ambiguous chars)
 */
export function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
