import { NextResponse } from 'next/server';
import crypto from 'crypto';
// Supabase is completely bypassed now

export async function POST(req: Request) {
  try {
    const { email, otp, hash, expiresAt } = await req.json();

    if (!email || !otp || !hash || !expiresAt) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (Date.now() > expiresAt) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_secret_key_123';
    const verifyHash = crypto.createHmac('sha256', secret)
      .update(`${email}.${otp}.${expiresAt}`)
      .digest('hex');

    if (verifyHash !== hash) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // The OTP is valid. Registration or Reset Password logic will proceed in their respective routes.
    // This endpoint now simply returns success if the hash is valid.
    return NextResponse.json({ 
      success: true
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
