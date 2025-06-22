// components/Dashboard/SettingsTab.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Shield, 
  Palette, 
  Key, 
  Save, 
  Eye, 
  EyeOff,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  Download
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
}

interface SettingsTabProps {
  user: User;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export default function SettingsTab({ user, theme, setTheme }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState("security");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
  });

  const sections = [
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "advanced", label: "Advanced", icon: Key },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePasswordUpdate = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      showMessage('error', 'Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      showMessage('error', 'New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Password updated successfully');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        showMessage('error', data.error || 'Failed to update password');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while updating password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: formData.emailNotifications,
          pushNotifications: formData.pushNotifications,
          marketingEmails: formData.marketingEmails,
        }),
      });

      if (response.ok) {
        showMessage('success', 'Notification settings saved successfully');
      } else {
        showMessage('error', 'Failed to save notification settings');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // Store theme preference in localStorage for persistence
    localStorage.setItem('theme', newTheme);
    showMessage('success', `Theme changed to ${newTheme}`);
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `user-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMessage('success', 'Data exported successfully');
      } else {
        showMessage('error', 'Failed to export data');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while exporting data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showMessage('success', 'Account deleted successfully');
        // Redirect to home page after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to delete account');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while deleting account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handlePasswordUpdate}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Theme Preference
              </h3>
              <div className="grid grid-cols-3 gap-4 max-w-md">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === option.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="text-center">
                        <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  {
                    key: "emailNotifications",
                    label: "Email Notifications",
                    description: "Receive notifications via email",
                  },
                  {
                    key: "pushNotifications",
                    label: "Push Notifications",
                    description: "Receive push notifications in your browser",
                  },
                  {
                    key: "marketingEmails",
                    label: "Marketing Emails",
                    description: "Receive updates about new features and promotions",
                  },
                ].map((option) => (
                  <div
                    key={option.key}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[option.key as keyof typeof formData] as boolean}
                        onChange={(e) => handleInputChange(option.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleNotificationSave}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Notification Settings"}
            </button>
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Management
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download a copy of your data for your records including profile, carts, reviews, and search history.
                  </p>
                  <button 
                    onClick={handleExportData}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {loading ? "Exporting..." : "Export Data"}
                  </button>
                </div>
                
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-900 dark:text-red-400 mb-2">
                    Delete Account
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Are you sure? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          {loading ? "Deleting..." : "Yes, Delete Account"}
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
}