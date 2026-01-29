/**
 * Environment Configuration with Zod Validation
 * Validates all required environment variables on startup
 */

import { z } from "zod";

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().default(3000)
  ),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

  // Cache (optional for now, Redis not yet implemented)
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL").optional(),

  // Security
  APP_SECRET: z
    .string()
    .min(1, "APP_SECRET is required")
    .refine(
      (val) => {
        // In production, require secure secret
        if (process.env.NODE_ENV === "production") {
          return val !== "default-secret-change-me" && val.length >= 32;
        }
        return true;
      },
      {
        message:
          "APP_SECRET must be at least 32 characters in production and not the default value",
      }
    )
    .default("default-secret-change-me"),

  ADMIN_API_TOKEN: z
    .string()
    .optional()
    .refine(
      (val) => {
        // In production, require token
        if (process.env.NODE_ENV === "production") {
          return val && val.trim().length > 0;
        }
        return true;
      },
      { message: "ADMIN_API_TOKEN is required in production" }
    ),

  // Legacy: IP hash whitelist (deprecated, use ADMIN_API_TOKEN instead)
  ADMIN_IP_HASHES: z.string().optional(),

  // Feature flags
  ENABLE_WEBSOCKET: z.preprocess(
    (val) => val === "true" || val === "1",
    z.boolean().default(false)
  ),
  ENABLE_RATE_LIMIT: z.preprocess(
    (val) => val === "true" || val === "1" || val === undefined,
    z.boolean().default(true)
  ),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    for (const issue of error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  throw error;
}

export default env;
