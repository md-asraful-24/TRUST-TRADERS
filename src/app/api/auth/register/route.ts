import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, createUser } from '@/lib/userStore';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Check existing user
    const existingUser = await findUserByEmail(emailLower);

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Default role and status
    const isSuperAdmin = emailLower === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'asrafulislamai1983@gmail.com').toLowerCase();
    const role = isSuperAdmin ? 'Admin' : 'User';
    const status = isSuperAdmin ? 'Active' : 'Hold';

    await createUser({
      email: emailLower,
      password: hashedPassword,
      role: role,
      status: status
    });

    // Create session cookie so middleware accepts request upon redirect
    await createSession({
      email: emailLower,
      role: role,
      status: status,
      isSuperAdmin
    });

    return NextResponse.json({
      success: true,
      role: role,
      status: status,
      isSuperAdmin
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

