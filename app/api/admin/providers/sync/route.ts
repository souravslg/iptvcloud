import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const { providerId } = await req.json();

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    // 1. Get provider info
    const provider = await db.prepare("SELECT * FROM providers WHERE id = ?").bind(providerId).first();
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // 2. Fetch M3U
    const response = await fetch(provider.url);
    if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.status}`);
    const m3uContent = await response.text();

    // 3. Basic M3U Parser
    const channels = parseM3U(m3uContent, providerId);
    
    // 4. Batch Insert into D1 (D1 has a limit on number of statements in a batch, usually 10,000)
    // We'll clear old channels for this provider first
    await db.prepare("DELETE FROM channels WHERE provider_id = ?").bind(providerId).run();

    // Insert in chunks of 100 to avoid limits and timeouts
    const CHUNK_SIZE = 100;
    for (let i = 0; i < channels.length; i += CHUNK_SIZE) {
      const chunk = channels.slice(i, i + CHUNK_SIZE);
      const statements = chunk.map(c => 
        db.prepare("INSERT INTO channels (provider_id, name, group_title, logo, stream_url) VALUES (?, ?, ?, ?, ?)")
          .bind(c.providerId, c.name, c.group, c.logo, c.url)
      );
      await db.batch(statements);
    }

    // Update last sync time
    await db.prepare("UPDATE providers SET last_sync = CURRENT_TIMESTAMP WHERE id = ?").bind(providerId).run();

    return NextResponse.json({ 
      message: "Sync completed", 
      count: channels.length 
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseM3U(content: string, providerId: number) {
  const lines = content.split('\n');
  const channels: any[] = [];
  let currentChannel: any = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const name = line.split(',').pop() || 'Unknown';
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      
      currentChannel = {
        providerId,
        name: name.trim(),
        group: groupMatch ? groupMatch[1] : 'Uncategorized',
        logo: logoMatch ? logoMatch[1] : '',
      };
    } else if (line.startsWith('http') && currentChannel) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }
  return channels;
}
