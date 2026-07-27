import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (5 minutes from now)
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Create a hash of the OTP + expiration + secret
    const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_secret_key_123';
    const hash = crypto.createHmac('sha256', secret)
      .update(`${email}.${otp}.${expiresAt}`)
      .digest('hex');

    let emailSent = false;
    let emailError = null;

    if (gmailUser && gmailPass && gmailUser !== "apnar_email@gmail.com") {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });

        const mailOptions = {
          from: `"Trust Traders Security" <${gmailUser}>`,
          to: email,
          subject: 'Your Trust Traders Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
              <h2 style="color: #0d9488; text-align: center;">Trust Traders Portal</h2>
              <p style="color: #334155; font-size: 16px;">Hello,</p>
              <p style="color: #334155; font-size: 16px;">Here is your secure 6-digit verification code. This code will expire in 5 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; background: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1;">
                  ${otp}
                </span>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center;">If you didn't request this code, please ignore this email.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        
        return NextResponse.json({ 
          success: true, 
          emailSent: true,
          hash, 
          expiresAt 
        });

      } catch (err: any) {
        console.error('Failed to send mail via Nodemailer:', err);
        return NextResponse.json({ error: 'Failed to send email. Please check your Gmail App Password in .env.local' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'GMAIL_USER and GMAIL_APP_PASSWORD are not configured properly in .env.local' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    return NextResponse.json({ error: error.message || 'Failed to process OTP request.' }, { status: 500 });
  }
}



