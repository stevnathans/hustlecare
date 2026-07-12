'use client';

import { useRouter, usePathname } from 'next/navigation';
import React from 'react';
import { LogIn, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
  title?: string;
  message?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  title = 'Sign in required',
  message = 'You must be logged in to add requirements to your business. Please sign in to continue.',
}) => {
  const router = useRouter();
  const currentPath = usePathname();

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    const callbackUrl = encodeURIComponent(currentPath || '/');
    router.push(`/signin?callbackUrl=${callbackUrl}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <LogIn className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-gray-600 text-sm mb-6">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoginRedirect}
              className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;