import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DesktopSidebar from "@/components/UserProfile/DesktopSidebar";
import MobileHeader from "@/components/UserProfile/MobileHeader";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="flex h-full">
        <DesktopSidebar />
        <MobileHeader />
        <main className="flex-1 md:pl-64 pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">User Profile</h1>
            <p>You are not signed in.</p>
          </div>
        </main>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return (
      <div className="flex h-full">
        <DesktopSidebar />
        <MobileHeader />
        <main className="flex-1 md:pl-64 pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">User Profile</h1>
            <p>User not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <DesktopSidebar />
      <MobileHeader />
      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <ProfileClient
            name={user.name}
            email={user.email}
            phone={user.phone}
            image={user.image}
            createdAt={user.createdAt.toISOString()}
          />
        </div>
      </main>
    </div>
  );
}