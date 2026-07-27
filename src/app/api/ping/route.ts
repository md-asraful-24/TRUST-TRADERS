import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  return NextResponse.json({ 
    ok: true,
    role: req.headers.get('x-user-role'),
    status: req.headers.get('x-user-status')
  });
}
