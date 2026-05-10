export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDbFromContext } from '@/db';
import { settings, channels } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const db = getDbFromContext();
  
  const globalSetting = await db.query.settings.findFirst({
    where: eq(settings.key, 'master_playlist')
  });
  
  const masterUrl = globalSetting?.value;
  if (!masterUrl) {
    return NextResponse.json({ error: 'No master playlist URL configured' }, { status: 400 });
  }

  try {
    const response = await fetch(masterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch master playlist' }, { status: 502 });
    }
    
    const m3uText = await response.text();
    const lines = m3uText.split(/\r?\n/);
    
    const parsedChannels = [];
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
            clearkey = nextLine.split('=')[1]?.trim() || '';
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

    if (parsedChannels.length > 0) {
      // 1. Get existing channels to avoid duplicates
      const existing = await db.query.channels.findMany({
        columns: { name: true, url: true }
      });
      const existingSet = new Set(existing.map((e: any) => `${e.name}|${e.url}`));

      // 2. Filter new channels
      const toInsert = parsedChannels
        .filter(c => !existingSet.has(`${c.name}|${c.url}`))
        .map(c => ({
          ...c,
          isMpd: c.url.toLowerCase().includes('.mpd'),
          isActive: true,
          createdAt: new Date()
        }));

      // 3. Batch insert in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        await db.insert(channels).values(chunk);
      }

      return NextResponse.json({ success: true, count: toInsert.length });
    }

    return NextResponse.json({ success: true, count: 0 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error during import' }, { status: 500 });
  }
}

