export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const result = await db.prepare('SELECT * FROM users ORDER BY id').all();
    return NextResponse.json(result.results || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { username, password, validUntil, isActive, sourceM3u } = body;
    const validUntilTs = Math.floor(new Date(validUntil).getTime() / 1000);
    const createdAt = Math.floor(Date.now() / 1000);
    const result = await db.prepare(
      'INSERT INTO users (username, password, valid_until, is_active, source_m3u, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(username, password, validUntilTs, isActive ? 1 : 0, sourceM3u || '', createdAt).first();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, username, password, validUntil, isActive, sourceM3u } = body;
    
    if (isActive !== undefined && !username) {
      // Toggle status only
      await db.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(isActive ? 1 : 0, id).run();
    } else {
      const validUntilTs = Math.floor(new Date(validUntil).getTime() / 1000);
      await db.prepare(
        'UPDATE users SET username = ?, password = ?, valid_until = ?, is_active = ?, source_m3u = ? WHERE id = ?'
      ).bind(username, password, validUntilTs, isActive ? 1 : 0, sourceM3u || '', id).run();
    }
    const updated = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const { id } = await request.json();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
