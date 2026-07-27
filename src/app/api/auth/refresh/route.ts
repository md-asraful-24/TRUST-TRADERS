import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/userStore';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Fetch latest user data
    const existingUser = await findUserByEmail(emailLower);

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSuperAdmin = emailLower === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'asrafulislamai1983@gmail.com').toLowerCase() || existingUser.role === 'Admin';

    // Recreate JWT session with updated role and status
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
    console.error('Error in refresh session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

