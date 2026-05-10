import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);

const Database = require('better-sqlite3');
const db = new Database('local.db');

const users = db.prepare('SELECT * FROM users').all();
const settings = db.prepare('SELECT * FROM settings').all();

let sql = '';

// Users
for (const u of users) {
  const src = (u.source_m3u || '').replace(/'/g, "''");
  sql += `INSERT OR IGNORE INTO users (id, username, password, valid_until, is_active, source_m3u, created_at) VALUES (${u.id}, '${u.username}', '${u.password}', ${u.valid_until}, ${u.is_active}, '${src}', ${u.created_at});\n`;
}

// Settings
for (const s of settings) {
  const val = (s.value || '').replace(/'/g, "''");
  sql += `INSERT OR IGNORE INTO settings (key, value) VALUES ('${s.key}', '${val}');\n`;
}

// Mark migration 0002 as done
sql += `INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0002_orange_dazzler.sql', datetime('now'));\n`;

writeFileSync('seed_remote.sql', sql);
console.log('Generated seed_remote.sql');
console.log(sql);
