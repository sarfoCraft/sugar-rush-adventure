import service from "./service.ts";

// Read the database dependency and typed service inputs supplied by Composer.
const input = service.input();
const { db } = service.load();
const firebaseServiceAccountJson = input.firebaseServiceAccountJson.expose();

if (!firebaseServiceAccountJson.trim()) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_JSON is required. Add it as a Prisma secret before deploying."
  );
}

// The existing Express API is retained. This adapter supplies Composer's
// database URL, reserved port, and secret inputs before importing server.js.
Object.assign(globalThis, {
  __SUGAR_RUSH_RUNTIME_CONFIG__: {
    PORT: String(service.port()),
    DATABASE_URL: db.url,
    FIREBASE_SERVICE_ACCOUNT_JSON: firebaseServiceAccountJson,
    ADMIN_UIDS: input.adminUids ?? "",
    FRONTEND_ORIGINS:
      input.frontendOrigins ??
      "https://sarfocraft.github.io,http://localhost:5500,http://127.0.0.1:5500",
    PAYMENT_INSTRUCTIONS_JSON: input.paymentInstructionsJson ?? "{}",
    DATABASE_SSL: "true",
    NODE_ENV: "production",
  },
});

await import("./server.js");
