export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDbFromContext } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const db = getDbFromContext();
  
  const allSettings = await db.query.settings.findMany();
  return NextResponse.json(allSettings);
}

export async function POST(request: NextRequest) {
  const db = getDbFromContext();
  
  const body = await request.json();
  const { key, value } = body;
  
  const result = await db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .returning();
    
  return NextResponse.json(result[0]);
}
