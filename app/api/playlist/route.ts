export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
// In a real implementation with Drizzle we would use:
// import { db } from '@/db';
// import { users, settings } from '@/db/schema';
// import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const password = searchParams.get('password');

  if (!username || !password) {
    return new NextResponse('Missing credentials', { status: 400 });
  }

  // --- Drizzle ORM mock logic start ---
  // const user = await db.select().from(users).where(and(eq(users.username, username), eq(users.password, password))).get();
  // const masterPlaylistUrl = await db.select().from(settings).where(eq(settings.key, 'master_playlist')).get();
  // --- Drizzle ORM mock logic end ---

  // Mocking database check for demonstration
  const isValidUser = username === 'admin' && password === 'admin';
  const isExpired = false; // Mock

  if (!isValidUser) {
    return new NextResponse('Invalid credentials', { status: 401 });
  }

  if (isExpired) {
    return new NextResponse(
      '#EXTM3U\n#EXTINF:-1, [EXPIRED] Your subscription has expired\nhttp://dummy-video.local/expired.mp4',
      { status: 200, headers: { 'Content-Type': 'application/x-mpegurl' } }
    );
  }

  // Fetch from master playlist
  // const response = await fetch(masterPlaylistUrl.value);
  // const playlistData = await response.text();
  
  // Mock playlist data
  const playlistData = `#EXTM3U\n#EXTINF:-1 tvg-id="CNN" tvg-name="CNN" tvg-logo="https://example.com/cnn.png" group-title="News",CNN (HD)\nhttp://example.com/live/cnn/index.m3u8`;

  return new NextResponse(playlistData, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-mpegurl',
      'Content-Disposition': `attachment; filename="playlist_${username}.m3u"`
    }
  });
}
