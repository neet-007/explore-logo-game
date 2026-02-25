import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./logo-game.db",
  },
  strict: true,
  verbose: true,
} satisfies Config;
