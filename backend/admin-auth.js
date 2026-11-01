/**
 * Parse Firebase Authentication UID allowlist from the hosting environment.
 * Only Firebase UID matches grant access, never email or a client-supplied flag.
 * Exported separately so parsing can be regression-tested without the database.
 */
export function parseAdminUids(raw) {
  if (raw === undefined || raw === null) return new Set();
  let value = String(raw).trim();
  if (!value) return new Set();
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) value = parsed.filter(x => typeof x === "string").join(",");
    } catch { /* Leave as a plain string; malformed JSON will not match a UID. */ }
  }
  const entries = value.split(/[,\r\n]+/).map(entry => {
    let uid = entry.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if ((uid.startsWith('"') && uid.endsWith('"')) || (uid.startsWith("'") && uid.endsWith("'"))) uid = uid.slice(1, -1).trim();
    return uid;
  }).filter(uid => uid.length > 0 && uid.length <= 128 && !uid.includes("@") && !/\s/.test(uid));
  return new Set(entries);
}
