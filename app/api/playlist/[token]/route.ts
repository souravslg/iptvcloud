import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDb();
    const { token } = params;

    // 1. Verify User Token (We'll use username as token for now, or ID)
    const user = await db.prepare("SELECT * FROM users WHERE username = ? AND is_active = 1").bind(token).first();
    if (!user) {
      return new NextResponse("Invalid or inactive user token", { status: 403 });
    }

    // 2. Fetch All Channels (or filtered if we add category management)
    const { results } = await db.prepare(`
      SELECT c.*, p.name as provider_name 
      FROM channels c 
      JOIN providers p ON c.provider_id = p.id
    `).all();

    // 3. Generate M3U
    let m3u = "#EXTM3U\n";
    results.forEach((c: any) => {
      m3u += `#EXTINF:-1 tvg-id="" tvg-logo="${c.logo}" group-title="${c.group_title}",${c.name}\n`;
      m3u += `${c.stream_url}\n`;
    });

    return new NextResponse(m3u, {
      headers: {
        "Content-Type": "application/x-mpegurl",
        "Content-Disposition": `attachment; filename="playlist.m3u"`,
      },
    });

  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
