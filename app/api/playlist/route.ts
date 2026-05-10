export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!username || !password) {
      return new NextResponse('Missing credentials', { status: 400 });
    }

    const db = getDb();

    // Get user from DB
    const userRow = await db.prepare(
      'SELECT * FROM users WHERE username = ? AND password = ?'
    ).bind(username, password).first() as any;

    if (!userRow) {
      return new NextResponse('Invalid credentials', { status: 401 });
    }

    // Check if suspended or expired
    const isSeconds = userRow.valid_until < 20000000000;
    const validUntilDate = new Date(isSeconds ? userRow.valid_until * 1000 : userRow.valid_until);
    const isExpired = validUntilDate < new Date();
    
    if (isExpired || !userRow.is_active) {
      return new NextResponse(
        `#EXTM3U\n#EXTINF:-1, [${!userRow.is_active ? 'SUSPENDED' : 'EXPIRED'}] Your subscription is not active\nhttp://dummy-video.local/inactive.mp4`,
        { status: 200, headers: { 'Content-Type': 'application/x-mpegurl' } }
      );
    }

    // Start building the M3U content
    let m3uContent = '#EXTM3U\n';

    // 1. Get managed channels from DB
    const managedChannels = await db.prepare(
      'SELECT * FROM channels WHERE is_active = 1'
    ).all();

    if (managedChannels.results) {
      for (const channel of managedChannels.results as any[]) {
        let tags = '';
        if (channel.is_mpd && channel.clearkey) {
          tags += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
          tags += `#KODIPROP:inputstream.adaptive.license_key=${channel.clearkey}\n`;
        }
        
        m3uContent += `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo || ''}" group-title="${channel.group_title || 'General'}",${channel.name}\n`;
        if (tags) m3uContent += tags;
        m3uContent += `${channel.url}\n`;
      }
    }

    // 2. Get source URL (either user-specific or global)
    let masterPlaylistUrl: string | null | undefined = userRow.source_m3u;
    
    if (!masterPlaylistUrl) {
      const globalSetting = await db.prepare(
        "SELECT value FROM settings WHERE key = 'master_playlist'"
      ).first() as any;
      masterPlaylistUrl = globalSetting?.value;
    }

    // 3. Append source M3U content if available
    if (masterPlaylistUrl) {
      try {
        const response = await fetch(masterPlaylistUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const sourceM3u = await response.text();
          const lines = sourceM3u.split(/\r?\n/);
          const filteredLines = lines.filter((line, index) => {
            if (index === 0 && line.trim().toUpperCase().startsWith('#EXTM3U')) return false;
            return true;
          });
          m3uContent += filteredLines.join('\n');
        } else {
          console.error(`Failed to fetch source playlist: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching source playlist:', error);
      }
    }

    return new NextResponse(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Content-Disposition': `attachment; filename="playlist_${username}.m3u"`
      }
    });
  } catch (e: any) {
    console.error('Playlist generation error:', e);
    return new NextResponse(`Error generating playlist: ${e.message}`, { status: 500 });
  }
}
