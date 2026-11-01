import { module } from "@prisma/composer";
import {
  envParam,
  envSecret,
  rawPostgres,
} from "@prisma/composer-prisma-cloud";
import apiService from "./backend/service.ts";

// The module name is the Prisma project name.
// Prisma provisions the database and injects its connection into the API service.
export default module("sugar-rush-adventure", ({ provision }) => {
  const db = provision(rawPostgres({ name: "database" }));

  provision(apiService, {
    deps: { db },
    input: {
      firebaseServiceAccountJson: envSecret("FIREBASE_SERVICE_ACCOUNT_JSON"),
      adminUids: envSecret("ADMIN_UIDS"),
      frontendOrigins: envParam("FRONTEND_ORIGINS"),
      paymentInstructionsJson: envParam("PAYMENT_INSTRUCTIONS_JSON"),
    },
  });
});
