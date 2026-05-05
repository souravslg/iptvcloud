export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDbFromContext } from '@/db';
import { channels } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const db = getDbFromContext();
  const allChannels = await db.query.channels.findMany({
    orderBy: [desc(channels.createdAt)]
  });
  return NextResponse.json(allChannels);
}

export async function POST(request: NextRequest) {
  const db = getDbFromContext();
  const body = await request.json();
  const { name, logo, group, url, isMpd, clearkey } = body;
  
  const result = await db.insert(channels).values({
    name,
    logo,
    group,
    url,
    isMpd: !!isMpd,
    clearkey,
    isActive: true,
    createdAt: new Date(),
  }).returning();
  
  return NextResponse.json(result[0]);
}

export async function PATCH(request: NextRequest) {
  const db = getDbFromContext();
  const body = await request.json();
  const { id, ...updates } = body;
  
  const result = await db.update(channels)
    .set(updates)
    .where(eq(channels.id, id))
    .returning();
    
  return NextResponse.json(result[0]);
}

export async function DELETE(request: NextRequest) {
  const db = getDbFromContext();
  const body = await request.json();
  
  if (body.all) {
    await db.delete(channels);
    return NextResponse.json({ success: true });
  }
  
  const { id } = body;
  await db.delete(channels).where(eq(channels.id, id));
  return NextResponse.json({ success: true });
}
