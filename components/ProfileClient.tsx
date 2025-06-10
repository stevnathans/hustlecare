"use client";

import React from "react";
import Image from "next/image";
import EditProfileModal from "@/components/EditProfileModal";
import { useRouter } from "next/navigation";

interface ProfileClientProps {
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  createdAt: string; // ISO string
}

export default function ProfileClient({ name, email, phone, image, createdAt }: ProfileClientProps) {
  const router = useRouter();

  function handleUpdate() {
    router.refresh(); // refresh server component data after update
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your account information
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header with Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          {/* Profile Content */}
          <div className="px-6 pb-8 sm:px-8">
            {/* Profile Picture and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center -mt-16">
              {/* Profile Picture */}
              <div className="relative">
                {image ? (
                  <Image
                    src={image}
                    alt={`${name} profile picture`}
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 bg-indigo-100 rounded-full flex items-center justify-center text-4xl font-bold text-indigo-600 border-4 border-white shadow-lg">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name and Edit Button */}
              <div className="mt-4 sm:mt-0 sm:ml-6 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                   <p className="text-base text-gray-500">
                    Member since {new Date(createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <EditProfileModal 
                    name={name} 
                    phone={phone} 
                    image={image} 
                    onUpdate={handleUpdate} 
                  />
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-6 w-full max-w-md space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">{email}</span>
                  </div>
                  
                  {phone && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-700">{phone}</span>
                    </div>
                  )}
                </div>
              </div>

          
            </div>

            {/* Stats (optional) */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">24</p>
                  <p className="text-sm text-gray-600">Projects</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">142</p>
                  <p className="text-sm text-gray-600">Connections</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">3</p>
                  <p className="text-sm text-gray-600">Years</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}