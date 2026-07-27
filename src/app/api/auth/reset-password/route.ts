import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const { email, password, otp, hash, expiresAt } = await req.json();

    if (!email || !password || !otp || !hash || !expiresAt) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify OTP first
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

    const emailLower = email.toLowerCase().trim();
    
    // Check if user exists
    const existingUser = await findUserByEmail(emailLower);

    if (!existingUser) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    await updateUser(null, emailLower, { password: hashedPassword });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in reset password:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

