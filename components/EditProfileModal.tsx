"use client";

import { useState, useEffect } from "react";

interface EditProfileModalProps {
  name: string;
  phone?: string | null;
  image?: string | null;
  onUpdate: () => void;
}

export default function EditProfileModal({ name, phone, image, onUpdate }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: name || "",
    phone: phone || "",
    image: image || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  function openModal() {
    setIsOpen(true);
    setError(null);
    setDebugInfo("");
  }

  function closeModal() {
    setIsOpen(false);
    setError(null);
    setDebugInfo("");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo("Starting request...");

    // Basic validation
    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    // Validate image URL if provided
    if (formData.image && formData.image.trim()) {
      try {
        new URL(formData.image.trim());
        setDebugInfo("URL validation passed");
      } catch {
        setError("Please enter a valid image URL");
        setLoading(false);
        return;
      }
    }

    const requestData = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      image: formData.image.trim() || null,
    };

    setDebugInfo(`Sending data: ${JSON.stringify(requestData)}`);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      setDebugInfo(`Response status: ${res.status}`);

      const responseData = await res.json();
      setDebugInfo(`Response data: ${JSON.stringify(responseData)}`);

      if (!res.ok) {
        throw new Error(responseData.message || `HTTP ${res.status}: Failed to update profile`);
      }

      // Call parent refresh function
      onUpdate();
      closeModal();
      
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Edit Profile
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Profile
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  disabled={loading}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="+254712345678"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    Profile Picture URL
                  </label>
                  
                  {/* Show preview if URL is provided */}
                  {formData.image && (
                    <div className="mt-2 mb-2">
                      <img
                        src={formData.image}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <input
                    id="image"
                    name="image"
                    type="url"
                    value={formData.image}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="https://example.com/avatar.jpg"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid image URL
                  </p>
                </div>

                {/* Debug info */}
                {debugInfo && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded max-h-20 overflow-y-auto">
                    <strong>Debug:</strong> {debugInfo}
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}