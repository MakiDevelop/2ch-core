/**
 * Content Guard - Malicious content detection using keyword/regex rules
 * No external API calls, runs entirely locally
 */

import badwordsData from "../../config/badwords.json";

export type ContentCheckResult = {
  flagged: boolean;
  score: number; // 0.0 - 1.0
  categories: string[]; // Categories that matched
  matchedTerms: string[]; // Matched terms for admin reference
};

type CategoryConfig = {
  terms?: string[];
  patterns?: string[];
  weight: number;
};

type BadwordsConfig = {
  [category: string]: CategoryConfig | { [key: string]: string[] };
};

const config = badwordsData as BadwordsConfig;

// Extract homophone map for normalization
const homophoneMap = (config.homophone_map || {}) as { [key: string]: string[] };

/**
 * Normalize text for better matching:
 * 1. Convert to lowercase
 * 2. Replace homophones with canonical form
 * 3. Remove common separator characters
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  // Replace homophones with canonical form
  for (const [canonical, variants] of Object.entries(homophoneMap)) {
    for (const variant of variants) {
      // Case-insensitive replacement
      const regex = new RegExp(escapeRegex(variant), "gi");
      normalized = normalized.replace(regex, canonical);
    }
  }

  // Remove common separators used to evade detection
  // Keep Chinese characters, letters, numbers
  normalized = normalized.replace(/[\s\*\.\-\_\+\=\|\~\`\!\@\#\$\%\^\&\(\)]/g, "");

  return normalized;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check content against all categories
 */
export function checkContent(content: string): ContentCheckResult {
  const normalized = normalizeText(content);
  const matchedCategories: string[] = [];
  const matchedTerms: string[] = [];
  let maxWeight = 0;

  // Process each category
  for (const [category, categoryConfig] of Object.entries(config)) {
    // Skip non-category entries like homophone_map
    if (category === "homophone_map") continue;

    const catConfig = categoryConfig as CategoryConfig;
    let categoryMatched = false;

    // Check terms
    if (catConfig.terms) {
      for (const term of catConfig.terms) {
        const normalizedTerm = normalizeText(term);
        if (normalized.includes(normalizedTerm)) {
          categoryMatched = true;
          matchedTerms.push(term);
        }
      }
    }

    // Check patterns
    if (catConfig.patterns) {
      for (const pattern of catConfig.patterns) {
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
      if (catConfig.weight > maxWeight) {
        maxWeight = catConfig.weight;
      }
    }
  }

  // Calculate final score based on matches
  // More categories matched = higher score, capped by max weight
  const categoryBonus = Math.min(matchedCategories.length * 0.1, 0.3);
  const score = Math.min(maxWeight + categoryBonus, 1.0);

  return {
    flagged: matchedCategories.length > 0,
    score: matchedCategories.length > 0 ? score : 0,
    categories: matchedCategories,
    matchedTerms: [...new Set(matchedTerms)], // Deduplicate
  };
}

/**
 * Check if content should be flagged for a specific board
 * NSFW board has relaxed rules for nsfw category
 */
export function checkContentForBoard(
  content: string,
  boardSlug?: string | null
): ContentCheckResult {
  const result = checkContent(content);

  // If on NSFW board, remove nsfw category from flags
  if (boardSlug === "nsfw" && result.categories.includes("nsfw")) {
    const filteredCategories = result.categories.filter((c) => c !== "nsfw");
    const filteredTerms = result.matchedTerms.filter(
      (t) => !config.nsfw?.terms?.includes(t)
    );

    // Recalculate if still flagged
    if (filteredCategories.length === 0) {
      return {
        flagged: false,
        score: 0,
        categories: [],
        matchedTerms: [],
      };
    }

    // Recalculate score without nsfw weight
    let maxWeight = 0;
    for (const cat of filteredCategories) {
      const catConfig = config[cat] as CategoryConfig;
      if (catConfig?.weight > maxWeight) {
        maxWeight = catConfig.weight;
      }
    }

    return {
      flagged: true,
      score: Math.min(maxWeight + filteredCategories.length * 0.1, 1.0),
      categories: filteredCategories,
      matchedTerms: filteredTerms,
    };
  }

  return result;
}

/**
 * Quick check if content might be problematic (for preview/warning)
 * Returns true if ANY term matches, doesn't calculate score
 */
export function quickCheck(content: string): boolean {
  const normalized = normalizeText(content);

  for (const [category, categoryConfig] of Object.entries(config)) {
    if (category === "homophone_map") continue;

    const catConfig = categoryConfig as CategoryConfig;

    if (catConfig.terms) {
      for (const term of catConfig.terms) {
        if (normalized.includes(normalizeText(term))) {
          return true;
        }
      }
    }

    if (catConfig.patterns) {
      for (const pattern of catConfig.patterns) {
        try {
          const regex = new RegExp(pattern, "gi");
          if (regex.test(content) || regex.test(normalized)) {
            return true;
          }
        } catch {
          // Ignore invalid patterns
        }
      }
    }
  }

  return false;
}
