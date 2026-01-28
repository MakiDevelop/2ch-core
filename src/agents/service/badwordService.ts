/**
 * Badword Service - Manage badwords in database
 * Provides CRUD operations and caching for content filtering
 */

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Types
export type BadwordCategory = {
  id: number;
  name: string;
  description: string | null;
  weight: number;
  isActive: boolean;
  termCount?: number;
  patternCount?: number;
};

export type Badword = {
  id: number;
  categoryId: number;
  categoryName?: string;
  term: string | null;
  pattern: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: string | null;
};

export type CreateBadwordParams = {
  categoryId: number;
  term?: string;
  pattern?: string;
  createdBy?: string;
};

export type BadwordConfig = {
  categories: {
    [name: string]: {
      terms: string[];
      patterns: string[];
      weight: number;
    };
  };
  homophoneMap: { [canonical: string]: string[] };
};

// Cache for badword config
let cachedConfig: BadwordConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60_000; // 1 minute cache

/**
 * Get all categories with counts
 */
export async function listCategories(): Promise<BadwordCategory[]> {
  const result = await pool.query(
    `SELECT
       c.id, c.name, c.description, c.weight, c.is_active,
       COUNT(b.id) FILTER (WHERE b.term IS NOT NULL) as term_count,
       COUNT(b.id) FILTER (WHERE b.pattern IS NOT NULL) as pattern_count
     FROM badword_categories c
     LEFT JOIN badwords b ON b.category_id = c.id AND b.is_active = true
     GROUP BY c.id
     ORDER BY c.name`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    weight: row.weight,
    isActive: row.is_active,
    termCount: parseInt(row.term_count, 10),
    patternCount: parseInt(row.pattern_count, 10),
  }));
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number): Promise<BadwordCategory | null> {
  const result = await pool.query(
    `SELECT id, name, description, weight, is_active
     FROM badword_categories WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    weight: row.weight,
    isActive: row.is_active,
  };
}

/**
 * Update category weight
 */
export async function updateCategoryWeight(
  id: number,
  weight: number
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE badword_categories SET weight = $1 WHERE id = $2 RETURNING id`,
    [weight, id]
  );
  if (result.rowCount && result.rowCount > 0) {
    invalidateCache();
    return true;
  }
  return false;
}

/**
 * List badwords with optional filtering
 */
export async function listBadwords(options?: {
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Badword[]; total: number }> {
  const { categoryId, search, limit = 50, offset = 0 } = options || {};

  let whereClause = "WHERE 1=1";
  const params: any[] = [];
  let paramIndex = 1;

  if (categoryId) {
    whereClause += ` AND b.category_id = $${paramIndex++}`;
    params.push(categoryId);
  }

  if (search) {
    whereClause += ` AND (b.term ILIKE $${paramIndex} OR b.pattern ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM badwords b ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get items
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT b.id, b.category_id, c.name as category_name, b.term, b.pattern,
            b.is_active, b.created_at, b.created_by
     FROM badwords b
     JOIN badword_categories c ON c.id = b.category_id
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return {
    items: result.rows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      term: row.term,
      pattern: row.pattern,
      isActive: row.is_active,
      createdAt: row.created_at,
      createdBy: row.created_by,
    })),
    total,
  };
}

/**
 * Create a new badword
 */
export async function createBadword(
  params: CreateBadwordParams
): Promise<{ success: boolean; badword?: Badword; error?: string }> {
  const { categoryId, term, pattern, createdBy } = params;

  // Validate: must have either term or pattern, not both
  if ((!term && !pattern) || (term && pattern)) {
    return { success: false, error: "必須提供 term 或 pattern（二擇一）" };
  }

  // Validate pattern is valid regex
  if (pattern) {
    try {
      new RegExp(pattern);
    } catch (e) {
      return { success: false, error: "無效的正則表達式" };
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO badwords (category_id, term, pattern, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, category_id, term, pattern, is_active, created_at, created_by`,
      [categoryId, term || null, pattern || null, createdBy || null]
    );

    invalidateCache();

    const row = result.rows[0];
    return {
      success: true,
      badword: {
        id: row.id,
        categoryId: row.category_id,
        term: row.term,
        pattern: row.pattern,
        isActive: row.is_active,
        createdAt: row.created_at,
        createdBy: row.created_by,
      },
    };
  } catch (err: any) {
    console.error("[BADWORD] Create error:", err);
    return { success: false, error: "建立失敗" };
  }
}

/**
 * Update a badword
 */
export async function updateBadword(
  id: number,
  updates: { term?: string; pattern?: string; isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.term !== undefined) {
    setClauses.push(`term = $${paramIndex++}`);
    params.push(updates.term || null);
  }

  if (updates.pattern !== undefined) {
    // Validate pattern
    if (updates.pattern) {
      try {
        new RegExp(updates.pattern);
      } catch (e) {
        return { success: false, error: "無效的正則表達式" };
      }
    }
    setClauses.push(`pattern = $${paramIndex++}`);
    params.push(updates.pattern || null);
  }

  if (updates.isActive !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    params.push(updates.isActive);
  }

  if (setClauses.length === 0) {
    return { success: false, error: "沒有要更新的欄位" };
  }

  params.push(id);
  const result = await pool.query(
    `UPDATE badwords SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING id`,
    params
  );

  if (result.rowCount && result.rowCount > 0) {
    invalidateCache();
    return { success: true };
  }

  return { success: false, error: "找不到該關鍵字" };
}

/**
 * Delete a badword
 */
export async function deleteBadword(id: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM badwords WHERE id = $1 RETURNING id`,
    [id]
  );

  if (result.rowCount && result.rowCount > 0) {
    invalidateCache();
    return true;
  }
  return false;
}

/**
 * Bulk import badwords from JSON config
 */
export async function importFromConfig(
  config: any,
  createdBy?: string
): Promise<{ imported: number; errors: number }> {
  let imported = 0;
  let errors = 0;

  // Get category name to ID mapping
  const categories = await listCategories();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  for (const [categoryName, categoryConfig] of Object.entries(config)) {
    if (categoryName === "homophone_map") continue;

    const categoryId = categoryMap.get(categoryName);
    if (!categoryId) {
      console.warn(`[BADWORD] Unknown category: ${categoryName}`);
      continue;
    }

    const catConfig = categoryConfig as any;

    // Import terms
    if (catConfig.terms) {
      for (const term of catConfig.terms) {
        const result = await createBadword({
          categoryId,
          term,
          createdBy,
        });
        if (result.success) imported++;
        else errors++;
      }
    }

    // Import patterns
    if (catConfig.patterns) {
      for (const pattern of catConfig.patterns) {
        const result = await createBadword({
          categoryId,
          pattern,
          createdBy,
        });
        if (result.success) imported++;
        else errors++;
      }
    }
  }

  // Import homophones
  if (config.homophone_map) {
    for (const [canonical, variants] of Object.entries(config.homophone_map)) {
      for (const variant of variants as string[]) {
        try {
          await pool.query(
            `INSERT INTO badword_homophones (canonical, variant)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [canonical, variant]
          );
        } catch (e) {
          // Ignore duplicates
        }
      }
    }
  }

  invalidateCache();
  return { imported, errors };
}

/**
 * Get badword config for content checking (with caching)
 */
export async function getBadwordConfig(): Promise<BadwordConfig> {
  const now = Date.now();

  // Return cached if valid
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // Fetch from database
  const categoriesResult = await pool.query(
    `SELECT id, name, weight FROM badword_categories WHERE is_active = true`
  );

  const badwordsResult = await pool.query(
    `SELECT b.category_id, c.name as category_name, b.term, b.pattern
     FROM badwords b
     JOIN badword_categories c ON c.id = b.category_id
     WHERE b.is_active = true AND c.is_active = true`
  );

  const homophonesResult = await pool.query(
    `SELECT canonical, variant FROM badword_homophones`
  );

  // Build config
  const config: BadwordConfig = {
    categories: {},
    homophoneMap: {},
  };

  // Initialize categories
  for (const row of categoriesResult.rows) {
    config.categories[row.name] = {
      terms: [],
      patterns: [],
      weight: row.weight,
    };
  }

  // Populate terms and patterns
  for (const row of badwordsResult.rows) {
    const cat = config.categories[row.category_name];
    if (!cat) continue;

    if (row.term) cat.terms.push(row.term);
    if (row.pattern) cat.patterns.push(row.pattern);
  }

  // Build homophone map
  for (const row of homophonesResult.rows) {
    if (!config.homophoneMap[row.canonical]) {
      config.homophoneMap[row.canonical] = [];
    }
    config.homophoneMap[row.canonical].push(row.variant);
  }

  // Update cache
  cachedConfig = config;
  cacheTimestamp = now;

  return config;
}

/**
 * Invalidate the cache (call after any modification)
 */
export function invalidateCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Get stats
 */
export async function getBadwordStats(): Promise<{
  totalTerms: number;
  totalPatterns: number;
  totalHomophones: number;
  byCategory: { name: string; terms: number; patterns: number }[];
}> {
  const statsResult = await pool.query(
    `SELECT
       c.name,
       COUNT(b.id) FILTER (WHERE b.term IS NOT NULL AND b.is_active) as terms,
       COUNT(b.id) FILTER (WHERE b.pattern IS NOT NULL AND b.is_active) as patterns
     FROM badword_categories c
     LEFT JOIN badwords b ON b.category_id = c.id
     WHERE c.is_active = true
     GROUP BY c.id, c.name
     ORDER BY c.name`
  );

  const homophoneCount = await pool.query(
    `SELECT COUNT(*) as count FROM badword_homophones`
  );

  let totalTerms = 0;
  let totalPatterns = 0;

  const byCategory = statsResult.rows.map((row) => {
    const terms = parseInt(row.terms, 10);
    const patterns = parseInt(row.patterns, 10);
    totalTerms += terms;
    totalPatterns += patterns;
    return { name: row.name, terms, patterns };
  });

  return {
    totalTerms,
    totalPatterns,
    totalHomophones: parseInt(homophoneCount.rows[0].count, 10),
    byCategory,
  };
}
