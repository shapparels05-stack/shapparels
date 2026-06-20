// Normalize a Pakistani phone number (as typed at checkout) to E.164.
// Accepts forms like "0300 1234567", "+92 300 1234567", "92300...",
// "3001234567". Returns "+923001234567" or null if it can't be parsed.
export function toE164Pk(raw: string): string | null {
  let d = (raw || "").replace(/[^\d]/g, ""); // strip +, spaces, dashes

  if (!d) return null;

  if (d.startsWith("0092")) d = d.slice(4); // 0092xxxxxxxxxx
  if (d.startsWith("92")) {
    // already country-coded
  } else if (d.startsWith("0")) {
    d = "92" + d.slice(1); // 03001234567 -> 923001234567
  } else if (d.length === 10 && d.startsWith("3")) {
    d = "92" + d; // 3001234567 -> 923001234567
  }

  // A valid PK mobile is 92 + 10 digits (3xxxxxxxxx).
  if (/^92\d{10}$/.test(d)) return `+${d}`;
  return null;
}

// Same, but bare digits (no leading +) for wa.me links.
export function toWaMePk(raw: string): string | null {
  const e164 = toE164Pk(raw);
  return e164 ? e164.slice(1) : null;
}
