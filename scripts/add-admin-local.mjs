import { createClient } from '@libsql/client';
import { randomBytes, scryptSync } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.error('Usage: node scripts/add-admin-local.mjs <username> <password>');
    process.exit(1);
}

const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const passwordHash = `scrypt:${salt}:${hash}`;

try {
    await client.execute({
        sql: 'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
        args: [username, passwordHash],
    });
    console.log(`Admin user '${username}' inserted.`);
} catch (err) {
    console.error('Failed to insert admin user:', err?.message || err);
    process.exit(1);
}
