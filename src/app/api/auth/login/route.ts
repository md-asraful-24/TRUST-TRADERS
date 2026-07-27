import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail } from '@/lib/userStore';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    const existingUser = await findUserByEmail(emailLower);

    if (!existingUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Password comparison (if user has no password set or matches hash)
    if (existingUser.password && existingUser.password !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isSuperAdmin = emailLower === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'asrafulislamai1983@gmail.com').toLowerCase() || existingUser.role === 'Admin';

    await createSession({
      email: emailLower,
      role: existingUser.role,
      status: existingUser.status,
      isSuperAdmin
    });

    return NextResponse.json({
      success: true,
      role: existingUser.role,
      status: existingUser.status,
      isSuperAdmin
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

