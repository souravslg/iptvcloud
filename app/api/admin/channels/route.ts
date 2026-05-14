export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const result = await db.prepare('SELECT * FROM channels ORDER BY id').all();
    const channels = (result.results || []).map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      logo: channel.logo || '',
      group: channel.group_title || 'General',
      url: channel.url,
      isMpd: !!channel.is_mpd,
      clearkey: channel.clearkey || '',
      isActive: !!channel.is_active,
      createdAt: channel.created_at
    }));
    return NextResponse.json(channels);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, logo, group, url, isMpd, clearkey } = body;
    const createdAt = Math.floor(Date.now() / 1000);
    const channel = await db.prepare(
      'INSERT INTO channels (name, logo, group_title, url, is_mpd, clearkey, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?) RETURNING *'
    ).bind(name, logo || '', group || 'General', url, isMpd ? 1 : 0, clearkey || '', createdAt).first() as any;
    
    return NextResponse.json({
      id: channel.id,
      name: channel.name,
      logo: channel.logo || '',
      group: channel.group_title || 'General',
      url: channel.url,
      isMpd: !!channel.is_mpd,
      clearkey: channel.clearkey || '',
      isActive: !!channel.is_active,
      createdAt: channel.created_at
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, logo, group, url, isMpd, clearkey, isActive } = body;

    if (isActive !== undefined && !name) {
      // Toggle only
      await db.prepare('UPDATE channels SET is_active = ? WHERE id = ?').bind(isActive ? 1 : 0, id).run();
    } else {
      await db.prepare(
        'UPDATE channels SET name = ?, logo = ?, group_title = ?, url = ?, is_mpd = ?, clearkey = ?, is_active = ? WHERE id = ?'
      ).bind(name, logo || '', group || 'General', url, isMpd ? 1 : 0, clearkey || '', isActive ? 1 : 0, id).run();
    }
    const channel = await db.prepare('SELECT * FROM channels WHERE id = ?').bind(id).first() as any;
    return NextResponse.json({
      id: channel.id,
      name: channel.name,
      logo: channel.logo || '',
      group: channel.group_title || 'General',
      url: channel.url,
      isMpd: !!channel.is_mpd,
      clearkey: channel.clearkey || '',
      isActive: !!channel.is_active,
      createdAt: channel.created_at
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    if (body.all) {
      await db.prepare('DELETE FROM channels').run();
    } else {
      await db.prepare('DELETE FROM channels WHERE id = ?').bind(body.id).run();
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
