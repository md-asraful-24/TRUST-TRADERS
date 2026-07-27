import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, oldPassword, newPassword } = await req.json();

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', emailLower)
      .single();

    if (findError || !existingUser) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const hashedOldPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');
    
    if (existingUser.password !== hashedOldPassword) {
      return NextResponse.json({ error: 'Incorrect old password' }, { status: 401 });
    }

    const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    
    const { error: updateError } = await supabase
      .from('custom_users')
      .update({ password: hashedNewPassword })
      .eq('email', emailLower);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error in change password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
