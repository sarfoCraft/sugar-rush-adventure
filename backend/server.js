import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import firebaseAdmin from "firebase-admin";
import { randomUUID, randomBytes } from "node:crypto";

const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_UIDS = new Set(String(process.env.ADMIN_UIDS || "").split(",").map(x => x.trim()).filter(Boolean));
const allowedOrigins = String(process.env.FRONTEND_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500")
  .split(",").map(x => x.trim()).filter(Boolean);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required. Do not deploy without Firebase token verification.");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount) });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return callback(null, true);
    return callback(new Error("This website origin is not allowed by the API CORS policy."));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400
}));
app.use(express.json({ limit: "2mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: "draft-7", legacyHeaders: false }));

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const SEASONS = ["Candy Forest", "Sugar Desert", "Frosting Peaks", "Gummy Galaxy", "Chocolate Kingdom"];
const COIN_PACKAGES = {
  20000: { coins: 20000, amountUsd: 3, amountPkr: 832 },
  50000: { coins: 50000, amountUsd: 5, amountPkr: 1386 }
};
const AI_CLEAR_COST = 5000;
const LEVEL_COMPLETION_REWARD = 2000;

function makeReferralCode() {
  return `SRA-${randomBytes(4).toString("hex").toUpperCase()}`;
}
function seasonForLevel(level) {
  const index = Math.floor((level - 1) / 20);
  return SEASONS[index] || `Bonus World ${index + 1}`;
}
function difficultyForLevel(level) {
  if (level <= 20) return "Easy";
  if (level <= 40) return "Medium";
  if (level <= 60) return "Hard";
  if (level <= 80) return "Expert";
  return "Master";
}
function defaultLevel(level) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  const type = n % 5 === 0 ? "timed" : n % 3 === 0 ? "jelly" : "score";
  return {
    name: `Level ${n}`,
    season: seasonForLevel(n),
    type,
    targetScore: 450 + (n - 1) * 4,
    moves: Math.max(20, 24 - Math.floor((n - 1) / 20)),
    timeLimit: type === "timed" ? 60 + Math.floor((n - 1) / 20) * 15 : 0,
    jellyGoal: type === "jelly" ? Math.min(30, 14 + Math.floor(n / 10) * 2) : 0
  };
}
function asJsonObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}
function playerState(row) {
  const aiDate = row.ai_uses_date instanceof Date ? row.ai_uses_date.toISOString().slice(0, 10) : String(row.ai_uses_date || new Date().toISOString()).slice(0, 10);
  return {
    coins: Number(row.coins) || 0,
    currentLevel: Number(row.current_level) || 1,
    maxUnlocked: Number(row.max_unlocked) || 1,
    levelStars: asJsonObject(row.level_stars),
    completedLevels: asJsonObject(row.completed_levels),
    aiUsesDate: aiDate,
    aiUsesCount: Number(row.ai_uses_count) || 0,
    bestScore: Number(row.best_score) || 0
  };
}
function publicProfile(row, referredByCode = null) {
  return {
    playerId: row.player_id,
    displayName: row.display_name,
    email: row.email || "",
    countryCode: row.country_code || "US",
    photoUrl: row.photo_url || "",
    referralCode: row.referral_code,
    referralCount: Number(row.referral_count) || 0,
    referredByCode: referredByCode || "",
    totalPlaySeconds: Number(row.total_play_seconds) || 0,
    currentLevel: Number(row.current_level) || 1,
    maxUnlocked: Number(row.max_unlocked) || 1,
    createdAt: row.created_at,
    lastSeen: row.last_seen
  };
}
function clientIp(req) {
  // Express derives req.ip from the trusted reverse-proxy chain. Do not trust the
  // first raw X-Forwarded-For value because clients can sometimes spoof it.
  return String(req.ip || req.socket?.remoteAddress || "unknown").slice(0, 100);
}
async function ensurePlayer(req) {
  const decoded = req.user;
  const displayName = String(decoded.name || (decoded.email ? decoded.email.split("@")[0] : "Guest Player")).slice(0, 20) || "Guest Player";
  const email = decoded.email || null;
  const photoUrl = decoded.picture || null;
  const ip = clientIp(req);
  const result = await pool.query(
    `INSERT INTO players (uid, player_id, email, display_name, photo_url, referral_code, last_seen, last_ip)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7)
     ON CONFLICT (uid) DO UPDATE SET
       email = COALESCE(EXCLUDED.email, players.email),
       display_name = CASE WHEN players.display_name IS NULL OR players.display_name = '' OR players.display_name = 'Guest Player' THEN EXCLUDED.display_name ELSE players.display_name END,
       photo_url = COALESCE(players.photo_url, EXCLUDED.photo_url),
       last_seen = NOW(), last_ip = EXCLUDED.last_ip
     RETURNING *`,
    [decoded.uid, randomUUID(), email, displayName, photoUrl, makeReferralCode(), ip]
  );
  return result.rows[0];
}
async function authenticate(req, res, next) {
  try {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Sign in to use the live game backend." });
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decoded;
    req.isAdmin = ADMIN_UIDS.has(decoded.uid);
    req.player = await ensurePlayer(req);
    if (req.player.banned && !req.isAdmin) return res.status(403).json({ error: `This account is banned${req.player.ban_reason ? `: ${req.player.ban_reason}` : "."}` });
    return next();
  } catch (error) {
    if (error?.code === "auth/id-token-expired" || error?.code === "auth/argument-error" || error?.code === "auth/invalid-id-token") {
      return res.status(401).json({ error: "Your session expired. Sign in again." });
    }
    return next(error);
  }
}
function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: "Administrator access is required." });
  return next();
}
async function getLevels(activeOnly = true) {
  const result = await pool.query(`SELECT * FROM game_levels ${activeOnly ? "WHERE active = TRUE" : ""} ORDER BY position ASC, created_at ASC`);
  return result.rows.map((row, index) => {
    const number = index + 1;
    return {
      id: row.id,
      number,
      position: Number(row.position) || number,
      name: row.name,
      season: row.season || seasonForLevel(number),
      type: row.type,
      targetScore: Number(row.target_score) || 450,
      moves: Number(row.moves) || 24,
      timeLimit: Number(row.time_limit) || 0,
      jellyGoal: Number(row.jelly_goal) || 0,
      difficulty: difficultyForLevel(number),
      active: Boolean(row.active),
      createdAt: row.created_at
    };
  });
}
async function levelCount() {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM game_levels WHERE active = TRUE");
  return Number(result.rows[0]?.count) || 0;
}
async function findLevelByNumber(number) {
  const result = await pool.query("SELECT * FROM game_levels WHERE active = TRUE ORDER BY position ASC, created_at ASC LIMIT 1 OFFSET $1", [number - 1]);
  return result.rows[0] || null;
}
function normalizeLevelInput(body, defaults = {}) {
  const name = String(body.name ?? defaults.name ?? "New Level").trim().slice(0, 60);
  const season = String(body.season ?? defaults.season ?? "Candy Forest").trim().slice(0, 60) || "Candy Forest";
  const type = String(body.type ?? defaults.type ?? "score");
  if (!name) throw new Error("Level name is required.");
  if (!["score", "timed", "jelly"].includes(type)) throw new Error("Level type must be score, timed, or jelly.");
  const targetScore = Math.floor(Number(body.targetScore ?? defaults.targetScore ?? 450));
  const moves = Math.floor(Number(body.moves ?? defaults.moves ?? 24));
  const timeLimit = Math.floor(Number(body.timeLimit ?? defaults.timeLimit ?? 0));
  const jellyGoal = Math.floor(Number(body.jellyGoal ?? defaults.jellyGoal ?? 0));
  if (!Number.isFinite(targetScore) || targetScore < 100 || targetScore > 1000000) throw new Error("Target score must be between 100 and 1,000,000.");
  if (!Number.isFinite(moves) || moves < 1 || moves > 100) throw new Error("Moves must be between 1 and 100.");
  if (!Number.isFinite(timeLimit) || timeLimit < 0 || timeLimit > 3600) throw new Error("Time limit must be between 0 and 3600 seconds.");
  if (!Number.isFinite(jellyGoal) || jellyGoal < 0 || jellyGoal > 64) throw new Error("Jelly goal must be between 0 and 64.");
  if (type === "timed" && timeLimit < 10) throw new Error("Timed levels need a time limit of at least 10 seconds.");
  if (type === "jelly" && jellyGoal < 1) throw new Error("Jelly levels need a jelly goal greater than zero.");
  return { name, season, type, targetScore, moves, timeLimit: type === "timed" ? timeLimit : 0, jellyGoal: type === "jelly" ? jellyGoal : 0 };
}
async function getPlayerRow(uid) {
  const result = await pool.query("SELECT * FROM players WHERE uid = $1", [uid]);
  if (!result.rows[0]) throw Object.assign(new Error("Player record was not found."), { status: 404 });
  return result.rows[0];
}
async function stateResponse(uid) {
  const row = await getPlayerRow(uid);
  return playerState(row);
}
async function accrueSession(uid, end = false) {
  await pool.query(
    `UPDATE players SET
      total_play_seconds = total_play_seconds + CASE WHEN last_heartbeat_at IS NULL THEN 0 ELSE LEAST(60, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - last_heartbeat_at)))::int)) END,
      last_heartbeat_at = CASE WHEN $2 THEN NULL ELSE NOW() END,
      session_started_at = CASE WHEN $2 THEN NULL ELSE COALESCE(session_started_at, NOW()) END,
      last_seen = NOW()
     WHERE uid = $1`, [uid, end]
  );
}
function orderShape(row) {
  return {
    id: row.id, uid: row.uid, playerName: row.player_name, email: row.email || "", coins: Number(row.coins),
    amountUsd: Number(row.amount_usd), amountPkr: Number(row.amount_pkr), paymentMethod: row.payment_method,
    payerName: row.payer_name, payerPhone: row.payer_phone, transactionReference: row.transaction_reference,
    note: row.note || "", attachmentName: row.attachment_name || "", attachmentDataUrl: row.attachment_data_url || "",
    status: row.status, createdAt: row.created_at, reviewedAt: row.reviewed_at, reviewedBy: row.reviewed_by
  };
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS players (
      uid TEXT PRIMARY KEY,
      player_id UUID NOT NULL UNIQUE,
      email TEXT,
      display_name TEXT NOT NULL DEFAULT 'Guest Player',
      country_code TEXT NOT NULL DEFAULT 'US',
      photo_url TEXT,
      referral_code TEXT NOT NULL UNIQUE,
      referred_by TEXT REFERENCES players(uid),
      referral_count INTEGER NOT NULL DEFAULT 0,
      banned BOOLEAN NOT NULL DEFAULT FALSE,
      ban_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMPTZ,
      last_ip TEXT,
      total_play_seconds BIGINT NOT NULL DEFAULT 0,
      session_started_at TIMESTAMPTZ,
      last_heartbeat_at TIMESTAMPTZ,
      coins INTEGER NOT NULL DEFAULT 200,
      best_score INTEGER NOT NULL DEFAULT 0,
      current_level INTEGER NOT NULL DEFAULT 1,
      max_unlocked INTEGER NOT NULL DEFAULT 1,
      level_stars JSONB NOT NULL DEFAULT '{}'::jsonb,
      completed_levels JSONB NOT NULL DEFAULT '{}'::jsonb,
      ai_uses_date DATE NOT NULL DEFAULT CURRENT_DATE,
      ai_uses_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS game_levels (
      id UUID PRIMARY KEY,
      position INTEGER NOT NULL,
      name TEXT NOT NULL,
      season TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('score','timed','jelly')),
      target_score INTEGER NOT NULL,
      moves INTEGER NOT NULL,
      time_limit INTEGER NOT NULL DEFAULT 0,
      jelly_goal INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS game_levels_active_position_idx ON game_levels(active, position);
    CREATE TABLE IF NOT EXISTS coin_orders (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL REFERENCES players(uid),
      player_name TEXT NOT NULL,
      email TEXT,
      coins INTEGER NOT NULL,
      amount_usd NUMERIC(10,2) NOT NULL,
      amount_pkr NUMERIC(12,2) NOT NULL,
      payment_method TEXT NOT NULL,
      payer_name TEXT NOT NULL,
      payer_phone TEXT NOT NULL,
      transaction_reference TEXT NOT NULL,
      note TEXT,
      attachment_name TEXT,
      attachment_data_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by TEXT
    );
    CREATE INDEX IF NOT EXISTS coin_orders_status_created_idx ON coin_orders(status, created_at DESC);
    CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY,
      referrer_uid TEXT NOT NULL REFERENCES players(uid),
      referred_uid TEXT NOT NULL UNIQUE REFERENCES players(uid),
      code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  const seeded = await pool.query("SELECT value FROM app_meta WHERE key = 'levels_seeded'");
  if (!seeded.rows.length) {
    const existing = await pool.query("SELECT COUNT(*)::int AS count FROM game_levels");
    if (Number(existing.rows[0].count) === 0) {
      for (let level = 1; level <= 100; level++) {
        const item = defaultLevel(level);
        await pool.query(
          `INSERT INTO game_levels (id, position, name, season, type, target_score, moves, time_limit, jelly_goal)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [randomUUID(), level, item.name, item.season, item.type, item.targetScore, item.moves, item.timeLimit, item.jellyGoal]
        );
      }
    }
    await pool.query("INSERT INTO app_meta (key, value) VALUES ('levels_seeded','true') ON CONFLICT (key) DO NOTHING");
  }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "sugar-rush-adventure-api" }));
app.get("/api/levels", wrap(async (_req, res) => res.json({ levels: await getLevels(true) })));
app.get("/api/payment-instructions", (_req, res) => {
  let instructions = {};
  try { instructions = JSON.parse(process.env.PAYMENT_INSTRUCTIONS_JSON || "{}"); } catch { instructions = {}; }
  res.json({ instructions });
});

app.use("/api", authenticate);

app.get("/api/player/state", wrap(async (req, res) => res.json({ state: await stateResponse(req.user.uid) })));
app.get("/api/player/profile", wrap(async (req, res) => {
  const row = await getPlayerRow(req.user.uid);
  let referredByCode = "";
  if (row.referred_by) {
    const ref = await pool.query("SELECT referral_code FROM players WHERE uid = $1", [row.referred_by]);
    referredByCode = ref.rows[0]?.referral_code || "";
  }
  res.json({ profile: publicProfile(row, referredByCode) });
}));
app.patch("/api/player/profile", wrap(async (req, res) => {
  const body = req.body || {};
  const updates = [];
  const values = [];
  if (body.displayName !== undefined) {
    const name = String(body.displayName).trim().slice(0, 20);
    if (!name) return res.status(400).json({ error: "Display name cannot be empty." });
    values.push(name); updates.push(`display_name = $${values.length}`);
  }
  if (body.countryCode !== undefined) {
    const country = String(body.countryCode).trim().toUpperCase().slice(0, 8) || "US";
    values.push(country); updates.push(`country_code = $${values.length}`);
  }
  const photoUrl = body.photoUrl ?? body.photoDataUrl;
  if (photoUrl !== undefined) {
    const photo = String(photoUrl || "");
    if (photo.length > 900000) return res.status(413).json({ error: "Profile image is too large. Choose an image under 500 KB." });
    if (photo && !/^https:\/\//i.test(photo) && !/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(photo)) {
      return res.status(400).json({ error: "Profile image must be an HTTPS URL or a JPG, PNG, or WEBP image." });
    }
    values.push(photo || null); updates.push(`photo_url = $${values.length}`);
  }
  if (updates.length) {
    values.push(req.user.uid);
    await pool.query(`UPDATE players SET ${updates.join(", ")} WHERE uid = $${values.length}`, values);
  }
  const row = await getPlayerRow(req.user.uid);
  let referredByCode = "";
  if (row.referred_by) {
    const ref = await pool.query("SELECT referral_code FROM players WHERE uid = $1", [row.referred_by]);
    referredByCode = ref.rows[0]?.referral_code || "";
  }
  res.json({ profile: publicProfile(row, referredByCode) });
}));
app.post("/api/player/session/start", wrap(async (req, res) => {
  await accrueSession(req.user.uid, true);
  await pool.query("UPDATE players SET session_started_at = NOW(), last_heartbeat_at = NOW(), last_seen = NOW(), last_ip = $2 WHERE uid = $1", [req.user.uid, clientIp(req)]);
  res.json({ ok: true });
}));
app.post("/api/player/session/heartbeat", wrap(async (req, res) => {
  await accrueSession(req.user.uid, false);
  await pool.query("UPDATE players SET last_ip = $2 WHERE uid = $1", [req.user.uid, clientIp(req)]);
  res.json({ ok: true });
}));
app.post("/api/player/session/end", wrap(async (req, res) => {
  await accrueSession(req.user.uid, true);
  await pool.query("UPDATE players SET last_ip = $2 WHERE uid = $1", [req.user.uid, clientIp(req)]);
  res.json({ ok: true });
}));
app.post("/api/player/start-level", wrap(async (req, res) => {
  const level = Math.floor(Number(req.body?.level));
  const count = await levelCount();
  if (!Number.isFinite(level) || level < 1 || level > count) return res.status(400).json({ error: "That level does not exist." });
  const player = await getPlayerRow(req.user.uid);
  if (level > Number(player.max_unlocked)) return res.status(403).json({ error: "This level is locked. Complete the previous levels first." });
  await pool.query("UPDATE players SET current_level = $2 WHERE uid = $1", [req.user.uid, level]);
  res.json({ state: await stateResponse(req.user.uid) });
}));
async function finishLevelForPlayer(uid, body = {}) {
  const level = Math.floor(Number(body.level));
  const count = await levelCount();
  if (!Number.isFinite(level) || level < 1 || level > count) throw Object.assign(new Error("That level does not exist."), { status: 400 });
  const levelRow = await findLevelByNumber(level);
  if (!levelRow) throw Object.assign(new Error("That level is unavailable."), { status: 404 });
  const player = await getPlayerRow(uid);
  if (level > Number(player.max_unlocked)) throw Object.assign(new Error("Complete the previous level first."), { status: 403 });
  const score = Math.max(0, Math.floor(Number(body.score) || 0));
  const jellyCleared = Boolean(body.jellyCleared);
  const won = levelRow.type === "jelly" ? jellyCleared : score >= Number(levelRow.target_score);
  if (!won) throw Object.assign(new Error("The submitted result does not meet this level's objective."), { status: 400 });
  const completed = asJsonObject(player.completed_levels);
  const starsMap = asJsonObject(player.level_stars);
  const alreadyCompleted = Boolean(completed[level]);
  completed[level] = true;
  const stars = Math.max(1, Math.min(3, score >= Number(levelRow.target_score) * 1.6 ? 3 : score >= Number(levelRow.target_score) ? 2 : 1));
  starsMap[level] = Math.max(Number(starsMap[level]) || 0, stars);
  const nextMax = Math.max(Number(player.max_unlocked) || 1, Math.min(count, level + 1));
  const bonus = alreadyCompleted ? 0 : LEVEL_COMPLETION_REWARD;
  await pool.query(
    `UPDATE players SET coins = coins + $2, current_level = GREATEST(current_level, $3), max_unlocked = $4, best_score = GREATEST(best_score, $5),
       level_stars = $6::jsonb, completed_levels = $7::jsonb WHERE uid = $1`,
    [uid, bonus, Math.min(count, level + 1), nextMax, score, JSON.stringify(starsMap), JSON.stringify(completed)]
  );
  return { state: await stateResponse(uid), rewardEarned: bonus > 0 };
}
app.post("/api/player/complete-level", wrap(async (req, res) => {
  const result = await finishLevelForPlayer(req.user.uid, req.body || {});
  res.json(result);
}));
app.post("/api/player/spend-coins", wrap(async (req, res) => {
  const amount = Math.floor(Number(req.body?.amount));
  if (!Number.isFinite(amount) || amount < 1 || amount > 5000) return res.status(400).json({ error: "Invalid coin amount." });
  const result = await pool.query("UPDATE players SET coins = coins - $2 WHERE uid = $1 AND coins >= $2 RETURNING *", [req.user.uid, amount]);
  if (!result.rows.length) return res.status(400).json({ error: "Not enough coins." });
  res.json({ state: playerState(result.rows[0]) });
}));
app.post("/api/ai/start-level", wrap(async (req, res) => {
  const level = Math.floor(Number(req.body?.level));
  const count = await levelCount();
  if (!Number.isFinite(level) || level < 1 || level > count) return res.status(400).json({ error: "That level does not exist." });
  const player = await getPlayerRow(req.user.uid);
  if (level > Number(player.max_unlocked)) return res.status(403).json({ error: "That level is locked." });
  const result = await pool.query("UPDATE players SET coins = coins - $2, current_level = $3, ai_uses_count = CASE WHEN ai_uses_date = CURRENT_DATE THEN ai_uses_count + 1 ELSE 1 END, ai_uses_date = CURRENT_DATE WHERE uid = $1 AND coins >= $2 RETURNING *", [req.user.uid, AI_CLEAR_COST, level]);
  if (!result.rows.length) return res.status(400).json({ error: `You need ${AI_CLEAR_COST.toLocaleString()} coins to use AI Auto-Play.` });
  res.json({ state: playerState(result.rows[0]) });
}));
app.post("/api/ai/finish-level", wrap(async (req, res) => {
  const result = await finishLevelForPlayer(req.user.uid, req.body || {});
  res.json(result);
}));

app.post("/api/referrals/apply", wrap(async (req, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase().slice(0, 30);
  if (!code) return res.status(400).json({ error: "Enter a referral code." });
  const me = await getPlayerRow(req.user.uid);
  if (me.referred_by) return res.status(409).json({ error: "A referral code has already been applied to this account." });
  if (String(me.referral_code).toUpperCase() === code) return res.status(400).json({ error: "You cannot use your own referral code." });
  const referrerResult = await pool.query("SELECT uid FROM players WHERE UPPER(referral_code) = $1", [code]);
  if (!referrerResult.rows.length) return res.status(404).json({ error: "That referral code was not found." });
  const referrerUid = referrerResult.rows[0].uid;
  if (referrerUid === req.user.uid) return res.status(400).json({ error: "You cannot refer yourself." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE players SET referred_by = $2 WHERE uid = $1 AND referred_by IS NULL", [req.user.uid, referrerUid]);
    await client.query("INSERT INTO referrals (id, referrer_uid, referred_uid, code, status) VALUES ($1,$2,$3,$4,'pending')", [randomUUID(), referrerUid, req.user.uid, code]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(409).json({ error: "A referral code has already been applied to this account." });
    throw error;
  } finally { client.release(); }
  const row = await getPlayerRow(req.user.uid);
  res.json({ ok: true, profile: publicProfile(row, code), message: "Referral recorded. Rewards require verification." });
}));

app.post("/api/coin-orders", wrap(async (req, res) => {
  const body = req.body || {};
  const pack = COIN_PACKAGES[Number(body.coins)];
  const paymentMethod = String(body.paymentMethod || "");
  const payerName = String(body.payerName || "").trim().slice(0, 60);
  const payerPhone = String(body.payerPhone || "").trim().slice(0, 24);
  const transactionReference = String(body.transactionReference || "").trim().slice(0, 100);
  const note = String(body.note || "").trim().slice(0, 180);
  const attachment = body.attachment && typeof body.attachment === "object" ? body.attachment : null;
  if (!pack) return res.status(400).json({ error: "Choose a valid coin package." });
  if (!["bank_transfer", "easypaisa", "jazzcash"].includes(paymentMethod)) return res.status(400).json({ error: "Choose a valid payment method." });
  if (!payerName || !payerPhone || !transactionReference) return res.status(400).json({ error: "Sender name, phone, and transaction reference are required." });
  const attachmentDataUrl = attachment?.dataUrl ? String(attachment.dataUrl) : "";
  if (attachmentDataUrl.length > 1000000) return res.status(413).json({ error: "Receipt file is too large." });
  if (attachmentDataUrl && !/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[a-z0-9+/=]+$/i.test(attachmentDataUrl)) return res.status(400).json({ error: "Receipt attachment type is not supported." });
  const id = `SM-${randomBytes(5).toString("hex").toUpperCase()}`;
  const result = await pool.query(
    `INSERT INTO coin_orders (id, uid, player_name, email, coins, amount_usd, amount_pkr, payment_method, payer_name, payer_phone, transaction_reference, note, attachment_name, attachment_data_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [id, req.user.uid, req.player.display_name, req.user.email || null, pack.coins, pack.amountUsd, pack.amountPkr, paymentMethod, payerName, payerPhone, transactionReference, note, String(attachment?.name || "").slice(0,120), attachmentDataUrl || null]
  );
  res.status(201).json({ order: orderShape(result.rows[0]) });
}));
app.get("/api/coin-orders/mine", wrap(async (req, res) => {
  const result = await pool.query("SELECT * FROM coin_orders WHERE uid = $1 ORDER BY created_at DESC LIMIT 50", [req.user.uid]);
  res.json({ orders: result.rows.map(orderShape) });
}));

app.get("/api/admin/coin-orders", requireAdmin, wrap(async (_req, res) => {
  const result = await pool.query("SELECT * FROM coin_orders ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 250");
  res.json({ orders: result.rows.map(orderShape) });
}));
app.post("/api/admin/coin-orders/:id/:action", requireAdmin, wrap(async (req, res) => {
  const action = req.params.action;
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "Unknown payment action." });
  const client = await pool.connect();
  let order;
  try {
    await client.query("BEGIN");
    const found = await client.query("SELECT * FROM coin_orders WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!found.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Payment request not found." }); }
    const current = found.rows[0];
    if (current.status !== "pending") { await client.query("ROLLBACK"); return res.status(409).json({ error: "This payment request has already been reviewed." }); }
    const nextStatus = action === "approve" ? "approved" : "rejected";
    const updated = await client.query("UPDATE coin_orders SET status = $2, reviewed_at = NOW(), reviewed_by = $3 WHERE id = $1 RETURNING *", [req.params.id, nextStatus, req.user.uid]);
    if (action === "approve") await client.query("UPDATE players SET coins = coins + $2 WHERE uid = $1", [current.uid, current.coins]);
    order = updated.rows[0];
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  const state = order.uid === req.user.uid ? await stateResponse(req.user.uid) : null;
  res.json({ order: orderShape(order), state });
}));

app.get("/api/admin/analytics", requireAdmin, wrap(async (_req, res) => {
  const [players, active, banned, hours, levels, referrals, pending] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS n FROM players"),
    pool.query("SELECT COUNT(*)::int AS n FROM players WHERE last_seen >= NOW() - INTERVAL '24 hours'"),
    pool.query("SELECT COUNT(*)::int AS n FROM players WHERE banned = TRUE"),
    pool.query("SELECT COALESCE(SUM(total_play_seconds),0)::bigint AS n FROM players"),
    pool.query("SELECT COUNT(*)::int AS n FROM game_levels WHERE active = TRUE"),
    pool.query("SELECT COUNT(*)::int AS n FROM referrals"),
    pool.query("SELECT COUNT(*)::int AS n FROM coin_orders WHERE status = 'pending'")
  ]);
  res.json({ analytics: {
    totalPlayers: Number(players.rows[0].n), active24h: Number(active.rows[0].n), bannedPlayers: Number(banned.rows[0].n),
    totalPlaySeconds: Number(hours.rows[0].n), totalLevels: Number(levels.rows[0].n), referrals: Number(referrals.rows[0].n), pendingPayments: Number(pending.rows[0].n)
  } });
}));
app.get("/api/admin/players", requireAdmin, wrap(async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 100);
  const pattern = `%${q}%`;
  const result = await pool.query(
    `SELECT uid, player_id, email, display_name, country_code, referral_code, referral_count, banned, ban_reason, created_at, last_seen, last_ip, total_play_seconds, current_level, max_unlocked
     FROM players WHERE ($1 = '' OR display_name ILIKE $2 OR COALESCE(email,'') ILIKE $2 OR player_id::text ILIKE $2 OR COALESCE(last_ip,'') ILIKE $2)
     ORDER BY last_seen DESC NULLS LAST LIMIT 250`, [q, pattern]
  );
  res.json({ players: result.rows.map(row => ({
    uid: row.uid, playerId: row.player_id, email: row.email || "", displayName: row.display_name, countryCode: row.country_code,
    referralCode: row.referral_code, referralCount: Number(row.referral_count) || 0, banned: Boolean(row.banned), banReason: row.ban_reason || "",
    createdAt: row.created_at, lastSeen: row.last_seen, lastIp: row.last_ip || "", totalPlaySeconds: Number(row.total_play_seconds) || 0,
    currentLevel: Number(row.current_level) || 1, maxUnlocked: Number(row.max_unlocked) || 1
  })) });
}));
app.post("/api/admin/players/:uid/ban", requireAdmin, wrap(async (req, res) => {
  if (req.params.uid === req.user.uid || ADMIN_UIDS.has(req.params.uid)) return res.status(400).json({ error: "You cannot ban an administrator account." });
  const reason = String(req.body?.reason || "Blocked by administrator").trim().slice(0, 240);
  const result = await pool.query("UPDATE players SET banned = TRUE, ban_reason = $2 WHERE uid = $1 RETURNING uid, banned, ban_reason", [req.params.uid, reason]);
  if (!result.rows.length) return res.status(404).json({ error: "Player not found." });
  res.json({ player: result.rows[0] });
}));
app.post("/api/admin/players/:uid/unban", requireAdmin, wrap(async (req, res) => {
  const result = await pool.query("UPDATE players SET banned = FALSE, ban_reason = NULL WHERE uid = $1 RETURNING uid, banned", [req.params.uid]);
  if (!result.rows.length) return res.status(404).json({ error: "Player not found." });
  res.json({ player: result.rows[0] });
}));
app.get("/api/admin/referrals", requireAdmin, wrap(async (_req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.code, r.status, r.created_at,
            a.uid AS referrer_uid, a.player_id AS referrer_player_id, a.display_name AS referrer_name, a.email AS referrer_email,
            b.uid AS referred_uid, b.player_id AS referred_player_id, b.display_name AS referred_name, b.email AS referred_email
     FROM referrals r JOIN players a ON a.uid = r.referrer_uid JOIN players b ON b.uid = r.referred_uid
     ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, r.created_at DESC LIMIT 500`
  );
  res.json({ referrals: result.rows.map(row => ({
    id: row.id, code: row.code, status: row.status, createdAt: row.created_at,
    referrerUid: row.referrer_uid, referrerPlayerId: row.referrer_player_id, referrerName: row.referrer_name, referrerEmail: row.referrer_email || "",
    referredUid: row.referred_uid, referredPlayerId: row.referred_player_id, referredName: row.referred_name, referredEmail: row.referred_email || ""
  })) });
}));
app.post("/api/admin/referrals/:id/:action", requireAdmin, wrap(async (req, res) => {
  const action = req.params.action;
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "Unknown referral action." });
  const client = await pool.connect();
  let referral;
  try {
    await client.query("BEGIN");
    const found = await client.query("SELECT * FROM referrals WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!found.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Referral record not found." }); }
    const current = found.rows[0];
    if (current.status !== "pending") { await client.query("ROLLBACK"); return res.status(409).json({ error: "This referral has already been reviewed." }); }
    const status = action === "approve" ? "approved" : "rejected";
    await client.query("UPDATE referrals SET status = $2 WHERE id = $1", [req.params.id, status]);
    if (action === "approve") await client.query("UPDATE players SET coins = coins + 3000, referral_count = referral_count + 1 WHERE uid = $1", [current.referrer_uid]);
    referral = { id: current.id, status, referrerUid: current.referrer_uid, referredUid: current.referred_uid };
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  res.json({ referral, rewardCoins: action === "approve" ? 3000 : 0 });
}));

app.get("/api/admin/levels", requireAdmin, wrap(async (_req, res) => res.json({ levels: await getLevels(true) })));
app.post("/api/admin/levels", requireAdmin, wrap(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE game_levels IN SHARE ROW EXCLUSIVE MODE");
    const countResult = await client.query("SELECT COUNT(*)::int AS count FROM game_levels WHERE active = TRUE");
    const currentCount = Number(countResult.rows[0]?.count) || 0;
    const defaults = defaultLevel(currentCount + 1);
    let item;
    try { item = normalizeLevelInput(req.body || {}, defaults); }
    catch (error) { await client.query("ROLLBACK"); return res.status(400).json({ error: error.message }); }
    const positionResult = await client.query("SELECT COALESCE(MAX(position),0)::int + 1 AS position FROM game_levels WHERE active = TRUE");
    const position = Number(positionResult.rows[0].position) || currentCount + 1;
    const result = await client.query(
      `INSERT INTO game_levels (id,position,name,season,type,target_score,moves,time_limit,jelly_goal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [randomUUID(), position, item.name, item.season || seasonForLevel(position), item.type, item.targetScore, item.moves, item.timeLimit, item.jellyGoal]
    );
    await client.query("COMMIT");
    res.status(201).json({ level: result.rows[0] });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally { client.release(); }
}));
app.put("/api/admin/levels/:id", requireAdmin, wrap(async (req, res) => {
  const found = await pool.query("SELECT * FROM game_levels WHERE id = $1 AND active = TRUE", [req.params.id]);
  if (!found.rows.length) return res.status(404).json({ error: "Active level not found." });
  let item;
  try { item = normalizeLevelInput(req.body || {}, found.rows[0]); } catch (error) { return res.status(400).json({ error: error.message }); }
  await pool.query(
    `UPDATE game_levels SET name=$2,season=$3,type=$4,target_score=$5,moves=$6,time_limit=$7,jelly_goal=$8,updated_at=NOW() WHERE id=$1`,
    [req.params.id,item.name,item.season,item.type,item.targetScore,item.moves,item.timeLimit,item.jellyGoal]
  );
  res.json({ levels: await getLevels(true) });
}));
app.post("/api/admin/levels/:id/clone", requireAdmin, wrap(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE game_levels IN SHARE ROW EXCLUSIVE MODE");
    const found = await client.query("SELECT * FROM game_levels WHERE id = $1 AND active = TRUE FOR UPDATE", [req.params.id]);
    if (!found.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Active level not found." }); }
    const source = found.rows[0];
    const posResult = await client.query("SELECT COALESCE(MAX(position),0)::int + 1 AS position FROM game_levels WHERE active = TRUE");
    const position = Number(posResult.rows[0].position) || 1;
    const result = await client.query(
      `INSERT INTO game_levels (id,position,name,season,type,target_score,moves,time_limit,jelly_goal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [randomUUID(),position,`${source.name} (Copy)`.slice(0,60),source.season||seasonForLevel(position),source.type,source.target_score,source.moves,source.time_limit,source.jelly_goal]
    );
    await client.query("COMMIT");
    res.status(201).json({ level: result.rows[0] });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally { client.release(); }
}));
app.post("/api/admin/levels/:id/clone-bulk", requireAdmin, wrap(async (req, res) => {
  const count = Number(req.body?.count);
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    return res.status(400).json({ error: "Number of clones must be a whole number between 1 and 500." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize level creation so concurrent admin actions cannot assign overlapping positions.
    await client.query("LOCK TABLE game_levels IN SHARE ROW EXCLUSIVE MODE");
    const found = await client.query("SELECT * FROM game_levels WHERE id = $1 AND active = TRUE FOR UPDATE", [req.params.id]);
    if (!found.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Active source level not found." });
    }
    const source = found.rows[0];
    const posResult = await client.query("SELECT COALESCE(MAX(position),0)::int AS last_position FROM game_levels WHERE active = TRUE");
    const startLevel = (Number(posResult.rows[0]?.last_position) || 0) + 1;
    const values = [];
    const tuples = [];
    for (let i = 0; i < count; i++) {
      const position = startLevel + i;
      const offset = values.length;
      tuples.push(`($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9})`);
      values.push(
        randomUUID(), position, `Level ${position}`.slice(0, 60),
        source.season || seasonForLevel(position), source.type,
        source.target_score, source.moves, source.time_limit, source.jelly_goal
      );
    }
    await client.query(
      `INSERT INTO game_levels (id,position,name,season,type,target_score,moves,time_limit,jelly_goal) VALUES ${tuples.join(",")}`,
      values
    );
    await client.query("COMMIT");
    const endLevel = startLevel + count - 1;
    res.status(201).json({ clonedCount: count, startLevel, endLevel, sourceLevel: Number(source.position) || null });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}));

app.delete("/api/admin/levels/:id", requireAdmin, wrap(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE game_levels IN SHARE ROW EXCLUSIVE MODE");
    const countResult = await client.query("SELECT COUNT(*)::int AS count FROM game_levels WHERE active = TRUE");
    if ((Number(countResult.rows[0]?.count) || 0) <= 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Keep at least one active level." });
    }
    const found = await client.query("SELECT id, position FROM game_levels WHERE id = $1 AND active = TRUE FOR UPDATE", [req.params.id]);
    if (!found.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Active level not found." }); }
    const position = Number(found.rows[0].position);
    await client.query("UPDATE game_levels SET active=FALSE,updated_at=NOW() WHERE id=$1", [req.params.id]);
    await client.query("UPDATE game_levels SET position=position-1,updated_at=NOW() WHERE active=TRUE AND position>$1", [position]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  const count = await levelCount();
  await pool.query("UPDATE players SET current_level = LEAST(current_level,$1), max_unlocked = GREATEST(1,LEAST(max_unlocked,$1))", [Math.max(1, count)]);
  res.json({ levels: await getLevels(true) });
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || (error.message?.includes("CORS") ? 403 : 500);
  res.status(status).json({ error: status === 500 ? "Internal server error. Check the backend logs." : error.message || "Request failed." });
});

await ensureSchema();
app.listen(PORT, () => {
  console.log(`Sugar Rush Adventure API listening on port ${PORT}`);
  if (!ADMIN_UIDS.size) console.warn("ADMIN_UIDS is empty. No account will have administrator access until you configure it.");
});
