import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    const existingUser = await findUserByEmail(emailLower);

    return NextResponse.json({
      exists: !!existingUser
    });
  } catch (error: any) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

