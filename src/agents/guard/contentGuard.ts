/**
 * Content Guard - Malicious content detection using keyword/regex rules
 * Supports both database-driven config (dynamic) and static JSON fallback
 */

import { getBadwordConfig, BadwordConfig } from "../service/badwordService";

// Fallback to static config if database is not available
import staticConfig from "../../config/badwords.json";

export type ContentCheckResult = {
  flagged: boolean;
  score: number; // 0.0 - 1.0
  categories: string[]; // Categories that matched
  matchedTerms: string[]; // Matched terms for admin reference
};

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize text for better matching:
 * 1. Convert to lowercase
 * 2. Replace homophones with canonical form
 * 3. Remove common separator characters
 */
function normalizeText(text: string, homophoneMap: { [key: string]: string[] }): string {
  let normalized = text.toLowerCase();

  // Replace homophones with canonical form
  for (const [canonical, variants] of Object.entries(homophoneMap)) {
    for (const variant of variants) {
      const regex = new RegExp(escapeRegex(variant), "gi");
      normalized = normalized.replace(regex, canonical);
    }
  }

  // Remove common separators used to evade detection
  normalized = normalized.replace(/[\s\*\.\-\_\+\=\|\~\`\!\@\#\$\%\^\&\(\)]/g, "");

  return normalized;
}

/**
 * Check content against config
 */
function checkContentWithConfig(
  content: string,
  config: BadwordConfig
): ContentCheckResult {
  const homophoneMap = config.homophoneMap || {};
  const normalized = normalizeText(content, homophoneMap);
  const matchedCategories: string[] = [];
  const matchedTerms: string[] = [];
  let maxWeight = 0;

  // Process each category
  for (const [category, categoryConfig] of Object.entries(config.categories)) {
    let categoryMatched = false;

    // Check terms
    if (categoryConfig.terms) {
      for (const term of categoryConfig.terms) {
        const normalizedTerm = normalizeText(term, homophoneMap);
        if (normalized.includes(normalizedTerm)) {
          categoryMatched = true;
          matchedTerms.push(term);
        }
      }
    }

    // Check patterns
    if (categoryConfig.patterns) {
      for (const pattern of categoryConfig.patterns) {
        try {
          const regex = new RegExp(pattern, "gi");
          if (regex.test(content) || regex.test(normalized)) {
            categoryMatched = true;
            matchedTerms.push(`[pattern: ${pattern}]`);
          }
        } catch (e) {
          console.error(`Invalid regex pattern: ${pattern}`, e);
        }
      }
    }

    if (categoryMatched) {
      matchedCategories.push(category);
      if (categoryConfig.weight > maxWeight) {
        maxWeight = categoryConfig.weight;
      }
    }
  }

  // Calculate final score
  const categoryBonus = Math.min(matchedCategories.length * 0.1, 0.3);
  const score = Math.min(maxWeight + categoryBonus, 1.0);

  return {
    flagged: matchedCategories.length > 0,
    score: matchedCategories.length > 0 ? score : 0,
    categories: matchedCategories,
    matchedTerms: [...new Set(matchedTerms)],
  };
}

/**
 * Convert static config to BadwordConfig format
 */
function convertStaticConfig(staticCfg: any): BadwordConfig {
  const config: BadwordConfig = {
    categories: {},
    homophoneMap: staticCfg.homophone_map || {},
  };

  for (const [category, catConfig] of Object.entries(staticCfg)) {
    if (category === "homophone_map") continue;

    const cfg = catConfig as any;
    config.categories[category] = {
      terms: cfg.terms || [],
      patterns: cfg.patterns || [],
      weight: cfg.weight || 0.5,
    };
  }

  return config;
}

/**
 * Check content against all categories (async - uses database)
 */
export async function checkContentAsync(content: string): Promise<ContentCheckResult> {
  try {
    const config = await getBadwordConfig();

    // If database has no data, fall back to static config
    const hasData = Object.values(config.categories).some(
      (c) => c.terms.length > 0 || c.patterns.length > 0
    );

    if (!hasData) {
      return checkContentWithConfig(content, convertStaticConfig(staticConfig));
    }

    return checkContentWithConfig(content, config);
  } catch (err) {
    console.error("[CONTENT-GUARD] Database error, using static config:", err);
    return checkContentWithConfig(content, convertStaticConfig(staticConfig));
  }
}

/**
 * Check content (sync - uses static config only)
 * Use this for quick checks where async is not possible
 */
export function checkContent(content: string): ContentCheckResult {
  return checkContentWithConfig(content, convertStaticConfig(staticConfig));
}

/**
 * Check if content should be flagged for a specific board
 * NSFW board has relaxed rules for nsfw category
 */
export async function checkContentForBoard(
  content: string,
  boardSlug?: string | null
): Promise<ContentCheckResult> {
  const result = await checkContentAsync(content);

  // If on NSFW board, remove nsfw category from flags
  if (boardSlug === "nsfw" && result.categories.includes("nsfw")) {
    const filteredCategories = result.categories.filter((c) => c !== "nsfw");

    if (filteredCategories.length === 0) {
      return {
        flagged: false,
        score: 0,
        categories: [],
        matchedTerms: [],
      };
    }

    // Recalculate score - need to get config for weights
    let config: BadwordConfig;
    try {
      config = await getBadwordConfig();
      const hasData = Object.values(config.categories).some(
        (c) => c.terms.length > 0 || c.patterns.length > 0
      );
      if (!hasData) {
        config = convertStaticConfig(staticConfig);
      }
    } catch {
      config = convertStaticConfig(staticConfig);
    }

    let maxWeight = 0;
    for (const cat of filteredCategories) {
      const catConfig = config.categories[cat];
      if (catConfig?.weight > maxWeight) {
        maxWeight = catConfig.weight;
      }
    }

    return {
      flagged: true,
      score: Math.min(maxWeight + filteredCategories.length * 0.1, 1.0),
      categories: filteredCategories,
      matchedTerms: result.matchedTerms,
    };
  }

  return result;
}

/**
 * Quick check if content might be problematic (sync, uses static config)
 */
export function quickCheck(content: string): boolean {
  const result = checkContent(content);
  return result.flagged;
}
