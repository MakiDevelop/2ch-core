import "dotenv/config";
import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  console.log("🚀 Running database migrations...");

  try {
    // 获取所有迁移文件并排序
    const migrationsDir = join(__dirname, "migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    // 逐个执行迁移
    for (const file of files) {
      console.log(`Running: ${file}`);
      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, "utf-8");

      await pool.query(sql);
      console.log(`✅ ${file} completed\n`);
    }

    console.log("✅ All migrations completed successfully!");

    // 验证结果
    try {
      const boardsResult = await pool.query(
        "SELECT slug, name FROM boards ORDER BY display_order"
      );
      console.log("\n📋 Boards created:");
      boardsResult.rows.forEach((row) => {
        console.log(`   - [${row.slug}] ${row.name}`);
      });

      const postsResult = await pool.query("SELECT COUNT(*) as count FROM posts");
      console.log(`\n📝 Total posts: ${postsResult.rows[0].count}`);
    } catch (err) {
      console.log("\n⚠️  Verification skipped (tables may not exist yet)");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
