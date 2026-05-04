export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const env = getRequestContext().env as { DB: D1Database };
  const db = getDb(env.DB);
  
  const allUsers = await db.query.users.findMany();
  return NextResponse.json(allUsers);
}

export async function POST(request: NextRequest) {
  const env = getRequestContext().env as { DB: D1Database };
  const db = getDb(env.DB);
  
  const body = await request.json();
  const { username, password, validUntil, isActive, sourceM3u } = body;
  
  const newUser = await db.insert(users).values({
    username,
    password,
    validUntil: new Date(validUntil),
    isActive: isActive ?? true,
    sourceM3u,
    createdAt: new Date(),
  }).returning();
  
  return NextResponse.json(newUser[0]);
}

export async function PATCH(request: NextRequest) {
  const env = getRequestContext().env as { DB: D1Database };
  const db = getDb(env.DB);
  
  const body = await request.json();
  const { id, ...updates } = body;
  
  if (updates.validUntil) {
    updates.validUntil = new Date(updates.validUntil);
  }
  
  const updatedUser = await db.update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning();
    
  return NextResponse.json(updatedUser[0]);
}

export async function DELETE(request: NextRequest) {
  const env = getRequestContext().env as { DB: D1Database };
  const db = getDb(env.DB);
  
  const { id } = await request.json();
  await db.delete(users).where(eq(users.id, id));
  
  return NextResponse.json({ success: true });
}
