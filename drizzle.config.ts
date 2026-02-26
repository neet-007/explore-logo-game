import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// This loads the variables from .env into process.env
dotenv.config({ path: ".env.local" });

export default {
    schema: "./lib/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL!,
        //authToken: process.env.TURSO_AUTH_TOKEN,
    },
    strict: true,
    verbose: true,
} satisfies Config;
