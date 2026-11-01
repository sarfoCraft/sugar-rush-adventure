import node from "@prisma/composer/node";
import { secretString } from "@prisma/composer/arktype";
import { type } from "arktype";
import {
  compute,
  rawPostgres,
} from "@prisma/composer-prisma-cloud";

const backendInput = type({
  firebaseServiceAccountJson: secretString(),
  adminUids: secretString(),
  "frontendOrigins?": "string",
  "paymentInstructionsJson?": "string",
});

export default compute({
  name: "api",
  deps: {
    db: rawPostgres(),
  },
  input: backendInput,
  build: node({
    module: import.meta.url,
    entry: "../dist/backend/prisma-server.mjs",
  }),
});
