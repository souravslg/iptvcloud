-- Initial Migration for IPTV Edge Panel

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  max_connections INTEGER DEFAULT 0,
  expiry_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT,
  password TEXT,
  type TEXT DEFAULT 'm3u',
  last_sync DATETIME
);

CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  group_title TEXT,
  logo TEXT,
  stream_url TEXT NOT NULL,
  is_mpd INTEGER DEFAULT 0,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Seed initial admin
INSERT OR IGNORE INTO users (username, password, is_active) VALUES ('admin', 'admin', 1);
