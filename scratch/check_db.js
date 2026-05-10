const Database = require('better-sqlite3');
const db = new Database('local.db');
const settings = db.prepare('SELECT * FROM settings').all();
console.log('Settings:', JSON.stringify(settings, null, 2));
const channelCount = db.prepare('SELECT COUNT(*) as count FROM channels').get();
console.log('Channel Count:', channelCount.count);
db.close();
