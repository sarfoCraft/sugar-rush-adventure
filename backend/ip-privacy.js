// Server-side privacy rules. Only the configured administrator UID allowlist
// decides whether a player record belongs to an admin; never trust client input.
export function ipForStorage(uid, ip, adminUids) {
  return adminUids.has(uid) ? null : ip;
}

export function playerIpMetadata(row, adminUids) {
  const isAdmin = adminUids.has(row.uid);
  return { isAdmin, ipAvailable: !isAdmin && Boolean(row.last_ip) };
}

export function revealedPlayerIp(row, adminUids) {
  // Returning null is intentional; do NOT send admin IP values to the client.
  if (adminUids.has(row.uid)) return { isAdmin: true, ip: null };
  return { isAdmin: false, ip: row.last_ip || null };
}
