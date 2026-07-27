import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Verify Vercel Cron Secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ping Supabase to keep the database awake
    const { data, error } = await supabase.from('custom_users').select('id').limit(1);

    if (error) {
      console.error('Cron job Supabase ping error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase pinged successfully to keep awake!' 
    });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
