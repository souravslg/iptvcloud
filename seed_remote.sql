INSERT OR IGNORE INTO users (id, username, password, valid_until, is_active, source_m3u, created_at) VALUES (1, 'testuser', 'testpass', 1780531200, 1, '', 1777950445);
INSERT OR IGNORE INTO users (id, username, password, valid_until, is_active, source_m3u, created_at) VALUES (2, 'test', 'test', 1780531200, 1, '', 1777956737);
INSERT OR IGNORE INTO settings (key, value) VALUES ('master_playlist', 'https://www.iptvindia.shop/jt/playlist.php');
INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0002_orange_dazzler.sql', datetime('now'));
