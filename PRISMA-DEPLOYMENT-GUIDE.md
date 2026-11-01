# Sugar Rush Adventure — Prisma Compute Deployment

This repository now includes a Prisma Composer setup for the **live API backend**.

## What Prisma will host

- `api`: the existing Express API, adapted to run on Prisma Compute.
- `database`: a Prisma Postgres database provisioned by the Composer module.

The public game interface remains on GitHub Pages:

`https://sarfocraft.github.io/sugar-rush-adventure/`

Prisma Compute does **not** replace the GitHub Pages frontend in this setup. It hosts the API and database. The API URL must be added to the frontend after the first successful deployment.

## Project and region

- Prisma project/module name: `sugar-rush-adventure`
- Region: `ap-southeast-1` (Asia Pacific, Singapore)
- API service name: `api`
- Database resource name: `database`

The database is created by `module.ts`. Do not create a separate database or add a `DATABASE_URL` variable for this Prisma deployment path.

## Before the first deployment: add the Firebase secret

In Prisma Console, open the `sugar-rush-adventure` project, select its production environment, and add the following environment variables.

| Variable | Required? | Value |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | The complete Firebase Admin service-account JSON, stored as a secret |
| `ADMIN_UIDS` | Recommended | Your Firebase Authentication user UID. Use the UID, not the email address |
| `FRONTEND_ORIGINS` | Optional | `https://sarfocraft.github.io` |
| `PAYMENT_INSTRUCTIONS_JSON` | Optional | JSON containing the payment instructions shown by the Coin Shop |

`ADMIN_UIDS` can contain multiple comma-separated Firebase UIDs. If it is empty, the API can start, but no account will receive administrator access.

### Where to get the Firebase service-account JSON

1. Open Firebase Console and select the Sugar Rush Adventure Firebase project.
2. Open Project settings → Service accounts.
3. Generate a private key and download the JSON file.
4. Copy the complete JSON content into the Prisma environment variable `FIREBASE_SERVICE_ACCOUNT_JSON`.
5. Mark/store it as a secret in Prisma.

**Never upload the service-account JSON to GitHub, include it in this ZIP, or paste it into `index.html`.** The Firebase Web App configuration used by the game's connection wizard is separate and is safe to use in the frontend.

The API defaults `FRONTEND_ORIGINS` to the current GitHub Pages origin if you leave that variable unset. If you later change the game's domain, update this variable to the exact origin (scheme + hostname, no page path).

## Deploy on push

The workflow is already included at:

`.github/workflows/prisma-deploy.yml`

It uses GitHub OIDC (`id-token: write`) and the existing repository connection in Prisma. No Prisma service token is stored in GitHub.

1. Upload/commit the updated project files to the repository's `main` branch.
2. Open GitHub → Actions → **Prisma deploy**.
3. Wait for the build and deploy job to finish.
4. A push to `main` targets production. A push to another branch creates a preview stage for that branch.

The workflow explicitly runs `bun install` and `bun run build`, so it does not rely on automatic package-manager detection. It uses Node.js 22 and Bun 1.3.10.

## Connect the deployed API to the game

After the first successful deployment:

1. Open the deployment summary in GitHub Actions or the Prisma Console.
2. Copy the public URL for the `api` service.
3. Open the root `index.html`.
4. Find this line:

   ```html
   <script>window.SUGAR_RUSH_API_BASE_URL = ""; // Paste your deployed Sugar Rush Adventure API URL here. The legacy SWEET_MATCH_API_BASE_URL is still supported.</script>
   ```

5. Replace the empty value with your actual Prisma API URL, for example:

   ```html
   <script>window.SUGAR_RUSH_API_BASE_URL = "https://YOUR-API-SERVICE.prisma.build";</script>
   ```

6. Commit the updated `index.html` to `main` and wait for GitHub Pages to update.

Do not use the example hostname above as a real URL. Copy the URL shown for your deployed `api` service.

Test the API by opening:

`https://YOUR-API-SERVICE.prisma.build/health`

A healthy API returns JSON similar to:

```json
{"ok":true,"service":"sugar-rush-adventure-api"}
```

## Database initialization and existing features

The existing `backend/server.js` is retained. On first successful startup it creates its required PostgreSQL tables and seeds the default levels if the levels table is empty. The admin API, Firebase ID-token verification, bulk level cloning, ads/customization settings, media library, and publish history remain in the existing backend code.

Prisma supplies the PostgreSQL connection to the API. The API uses a small PostgreSQL connection pool to suit Compute's scale-to-zero behavior.

## Other hosting providers

The original `backend/package.json` and `backend/server.js` remain compatible with the separate Node.js hosting instructions in `ADMIN-DEPLOYMENT-GUIDE.md`. The Prisma-specific adapter is in `backend/prisma-server.ts`; it does not replace the regular `npm start` entry point.
