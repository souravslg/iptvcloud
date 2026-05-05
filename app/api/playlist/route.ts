export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDbFromContext } from '@/db';
import { users, settings, channels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const password = searchParams.get('password');

  if (!username || !password) {
    return new NextResponse('Missing credentials', { status: 400 });
  }

  const db = getDbFromContext();

  // Get user from DB
  const user = await db.query.users.findFirst({
    where: and(eq(users.username, username), eq(users.password, password))
  });

  if (!user) {
    return new NextResponse('Invalid credentials', { status: 401 });
  }

  // Check if suspended or expired
  const isExpired = new Date(user.validUntil) < new Date();
  if (isExpired || !user.isActive) {
    return new NextResponse(
      `#EXTM3U\n#EXTINF:-1, [${!user.isActive ? 'SUSPENDED' : 'EXPIRED'}] Your subscription is not active\nhttp://dummy-video.local/inactive.mp4`,
      { status: 200, headers: { 'Content-Type': 'application/x-mpegurl' } }
    );
  }

  // Start building the M3U content
  let m3uContent = '#EXTM3U\n';

  // 1. Get managed channels from DB
  const managedChannels = await db.query.channels.findMany({
    where: eq(channels.isActive, true)
  });

  for (const channel of managedChannels) {
    let tags = '';
    if (channel.isMpd && channel.clearkey) {
      tags += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
      tags += `#KODIPROP:inputstream.adaptive.license_key=${channel.clearkey}\n`;
    }
    
    m3uContent += `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo || ''}" group-title="${channel.group || 'General'}",${channel.name}\n`;
    if (tags) m3uContent += tags;
    m3uContent += `${channel.url}\n`;
  }

  // 2. Get source URL (either user-specific or global)
  let masterPlaylistUrl: string | null | undefined = user.sourceM3u;
  
  if (!masterPlaylistUrl) {
    const globalSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'master_playlist')
    });
    masterPlaylistUrl = globalSetting?.value;
  }

  // 3. Append source M3U content if available
  if (masterPlaylistUrl) {
    try {
      const response = await fetch(masterPlaylistUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        // Add a reasonable timeout if supported by the environment, or just rely on the runtime
      });
      
      if (response.ok) {
        const sourceM3u = await response.text();
        // More robust header removal: remove everything until the first #EXTINF or similar, 
        // or just the #EXTM3U line and any immediate following lines that are part of the header.
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
}
