import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log("🚀 Running database migrations...");

  try {
    // 读取迁移文件
    const migrationPath = join(__dirname, "migrations", "001_add_boards.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    // 执行迁移
    await pool.query(sql);

    console.log("✅ Migration completed successfully!");

    // 验证结果
    const boardsResult = await pool.query("SELECT slug, name FROM boards ORDER BY display_order");
    console.log("\n📋 Boards created:");
    boardsResult.rows.forEach((row) => {
      console.log(`   - [${row.slug}] ${row.name}`);
    });

    const postsResult = await pool.query(
      "SELECT COUNT(*) as count FROM posts WHERE board_id IS NOT NULL"
    );
    console.log(
      `\n📝 Posts with board_id: ${postsResult.rows[0].count}`
    );
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
