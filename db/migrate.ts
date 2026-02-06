import "dotenv/config";
import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureTrackingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await pool.query("SELECT filename FROM _migrations ORDER BY filename");
  return new Set(result.rows.map((r) => r.filename));
}

async function runMigrations() {
  console.log("Running database migrations...");

  try {
    await ensureTrackingTable();
    const executed = await getExecutedMigrations();

    const migrationsDir = join(__dirname, "migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !executed.has(f));

    if (pending.length === 0) {
      console.log(`All ${files.length} migrations already applied. Nothing to do.`);
      return;
    }

    console.log(`Found ${files.length} total, ${pending.length} pending\n`);

    for (const file of pending) {
      console.log(`Running: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), "utf-8");

      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          "INSERT INTO _migrations (filename) VALUES ($1)",
          [file]
        );
        await pool.query("COMMIT");
        console.log(`  ${file} done`);
      } catch (err) {
        await pool.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${err}`);
      }
    }

    console.log(`\nAll ${pending.length} migrations applied successfully.`);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
