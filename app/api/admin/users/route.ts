import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    // Use raw SQL for D1
    const { results } = await db.prepare("SELECT * FROM users ORDER BY id DESC").all();
    
    // Map database snake_case to camelCase
    const users = results.map((u: any) => ({
      id: u.id,
      username: u.username,
      isActive: Boolean(u.is_active),
      maxConnections: u.max_connections,
      expiryDate: u.expiry_date
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("User fetch error:", error);
    // If table doesn't exist yet, return empty array instead of crashing
    if (error.message?.includes("no such table")) {
        return NextResponse.json([]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
