// app/api/signup/route.ts
import { hash } from 'bcrypt';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import WelcomeEmail from '@/emails/WelcomeEmail';

type UserData = {
  name: string;
  email: string;
  image?: string | null;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, image, isOAuth } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and Email are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 409 }
      );
    }

    const userData: UserData = {
      name,
      email: normalizedEmail,
      image: image || null,
    };

    if (!isOAuth) {
      if (!password) {
        return NextResponse.json(
          { message: 'Password is required for traditional signup' },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      userData.password = await hash(password, 10);
    }

    const newUser = await prisma.user.create({ data: userData });

    // Send welcome email — fire and forget.
    // We never let an email failure block account creation.
    sendEmail({
      to: newUser.email,
      subject: 'Welcome to HustleCare 🚀',
      react: WelcomeEmail({ name: newUser.name }),
      type: 'WELCOME',
      userId: newUser.id,
    }).catch((err) =>
      console.error('[email] Welcome email failed for', newUser.id, err?.message)
    );

    const { password: _password, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });

  } catch (error: unknown) {
    console.error('Signup API Error:', (error instanceof Error ? error.message : error));
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}