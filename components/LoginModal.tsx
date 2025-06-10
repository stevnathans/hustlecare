'use client';

import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const currentPath = usePathname();

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    // Encode the current path to use as callbackUrl
    const callbackUrl = encodeURIComponent(currentPath || '/');
    router.push(`/signin?callbackUrl=${callbackUrl}`);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md animate-fade-in-up">
        {/* Header with decorative accent */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 w-full"></div>
        
        <div className="p-6">
          <div className="flex items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Login Required</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            You must be logged in to add requirements to your business. Please sign in to continue.
          </p>
          
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleLoginRedirect}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;