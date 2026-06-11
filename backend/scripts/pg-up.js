/* Live-validation helper: boots a real embedded PostgreSQL instance.
   Used only to validate migrations + APIs end-to-end without Docker.

   This is an OPTIONAL dev tool and is intentionally NOT a project dependency
   (so CI stays lean). Install it on demand first:

       npm install -D embedded-postgres

   Then:  node scripts/pg-up.js   (keep running; connect on port 5433)
*/
const path = require("path");
let EmbeddedPostgres;
try {
  EmbeddedPostgres = require("embedded-postgres").default || require("embedded-postgres");
} catch {
  console.error("[pg-up] 'embedded-postgres' is not installed. Run: npm install -D embedded-postgres");
  process.exit(1);
}

const PORT = 5433;
const USER = "shai";
const PASSWORD = "shai";
const DB = "smart_home_ai";

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(__dirname, "..", ".pgdata"),
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: false,
  });

  const fs = require("fs");
  const dataDir = path.join(__dirname, "..", ".pgdata");
  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB);
  } catch (e) {
    // database may already exist
  }
  console.log("PG_READY url=postgresql://" + USER + ":" + PASSWORD + "@localhost:" + PORT + "/" + DB + "?schema=public");

  const shutdown = async () => {
    try {
      await pg.stop();
    } catch {}
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error("PG_FAILED", err);
  process.exit(1);
});
