export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    
    const settingRow = await db.prepare("SELECT value FROM settings WHERE key = 'master_playlist'").first() as any;
    const masterUrl = settingRow?.value;
    
    if (!masterUrl) {
      return NextResponse.json({ error: 'No master playlist URL configured' }, { status: 400 });
    }

    const response = await fetch(masterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch master playlist' }, { status: 502 });
    }
    
    const m3uText = await response.text();
    const lines = m3uText.split(/\r?\n/);
    
    const parsedChannels: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
        const logo = logoMatch ? logoMatch[1] : '';
        const group = groupMatch ? groupMatch[1] : 'General';
        
        let url = '';
        let clearkey = '';
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (!nextLine) continue;
          if (nextLine.startsWith('#KODIPROP:inputstream.adaptive.license_key=')) {
            clearkey = nextLine.split('=').slice(1).join('=').trim();
            continue;
          }
          if (!nextLine.startsWith('#')) {
            url = nextLine;
            i = j;
            break;
          }
        }
        
        if (url) {
          parsedChannels.push({ name, logo, group, url, clearkey });
        }
      }
    }

    if (parsedChannels.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Get existing channels to avoid duplicates
    const existing = await db.prepare('SELECT name, url FROM channels').all();
    const existingSet = new Set((existing.results || []).map((e: any) => `${e.name}|${e.url}`));

    const toInsert = parsedChannels.filter(c => !existingSet.has(`${c.name}|${c.url}`));
    const createdAt = Math.floor(Date.now() / 1000);

    // Insert in batches of 50
    const chunkSize = 50;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO channels (name, logo, group_title, url, is_mpd, clearkey, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
      );
      const batch = chunk.map(c => stmt.bind(
        c.name, c.logo || '', c.group || 'General', c.url,
        c.url.toLowerCase().includes('.mpd') ? 1 : 0,
        c.clearkey || '', createdAt
      ));
      await db.batch(batch);
    }

    return NextResponse.json({ success: true, count: toInsert.length });
  } catch (e: any) {
    console.error('Import error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
