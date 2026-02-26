import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./logo-game.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url: dbUrl,
    //authToken,
});

export const db = drizzle(client);
