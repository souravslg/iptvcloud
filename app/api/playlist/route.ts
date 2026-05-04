export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db';
import { users, settings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const password = searchParams.get('password');

  if (!username || !password) {
    return new NextResponse('Missing credentials', { status: 400 });
  }

  const env = getRequestContext().env as any;
  const db = getDb(env.DB);

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

  // Get source URL (either user-specific or global)
  let masterPlaylistUrl: string | null | undefined = user.sourceM3u;
  
  if (!masterPlaylistUrl) {
    const globalSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'master_playlist')
    });
    masterPlaylistUrl = globalSetting?.value;
  }

  if (!masterPlaylistUrl) {
    return new NextResponse('No source playlist configured', { status: 500 });
  }

  try {
    const response = await fetch(masterPlaylistUrl);
    const playlistData = await response.text();

    return new NextResponse(playlistData, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Content-Disposition': `attachment; filename="playlist_${username}.m3u"`
      }
    });
  } catch (error) {
    return new NextResponse('Error fetching source playlist', { status: 502 });
  }
}
