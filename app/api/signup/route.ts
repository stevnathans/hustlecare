// app/api/signup/route.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Define the user data type for better type safety
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

    // Basic validation for common fields
    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and Email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    // This check is important here as well, even if NextAuth's signIn callback also checks.
    // It prevents direct API calls from creating duplicates if, for some reason,
    // the NextAuth check was bypassed or if this API is used elsewhere.
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Store and check email in lowercase for consistency
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 409 } // 409 Conflict
      );
    }

    // Use const instead of let since we're creating a new object each time
    const userData: UserData = {
      name,
      email: email.toLowerCase(), // Store email in lowercase
      image: image || null, // Store image if provided, otherwise null
    };

    if (isOAuth) {
      // For OAuth users, password is not set.
      // The User model in Prisma should have `password String?` (optional)
      // If an OAuth user somehow tries to sign up via a form that submits `isOAuth: true`
      // and includes a password, we simply ignore the password.
      console.log(`Creating OAuth user: ${email}`);
    } else {
      // Traditional email/password signup
      if (!password) {
        return NextResponse.json(
          { message: 'Password is required for traditional signup' },
          { status: 400 }
        );
      }
      if (password.length < 6) { // Example: Enforce minimum password length
          return NextResponse.json(
              { message: 'Password must be at least 6 characters long' },
              { status: 400 }
          );
      }
      const hashedPassword = await hash(password, 10);
      userData.password = hashedPassword;
      console.log(`Creating traditional user: ${email}`);
    }

    // Create the user in the database
    const newUser = await prisma.user.create({
      data: userData,
    });

    // Exclude password from the returned user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = newUser;

    // Return the created user object (without password)
    // This is what the NextAuth signIn callback expects
    return NextResponse.json(safeUser, { status: 201 });

  } catch (error: unknown) {
    console.error('Signup API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { message: 'An unexpected error occurred.', error: errorMessage },
      { status: 500 }
    );
  }
}