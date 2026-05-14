import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM providers").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Provider fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const { name, url, username, password, type } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const { success } = await db.prepare(
      "INSERT INTO providers (name, url, username, password, type) VALUES (?, ?, ?, ?, ?)"
    ).bind(name, url, username || null, password || null, type || 'm3u').run();

    if (success) {
      return NextResponse.json({ message: "Provider added successfully" });
    }
    throw new Error("Failed to insert provider");
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
