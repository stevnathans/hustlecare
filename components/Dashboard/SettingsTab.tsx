// components/Dashboard/SettingsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Shield, Palette, Key, Save, Eye, EyeOff,
  Moon, Sun, Monitor, AlertTriangle, Download,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
}

interface NotificationPrefs {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

interface SettingsTabProps {
  user: User;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  initialNotifications: NotificationPrefs;
}

export default function SettingsTab({
  user,
  theme,
  setTheme,
  initialNotifications,
}: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState("notifications");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialised from real DB values passed as props — no hardcoded defaults
  const [notifications, setNotifications] = useState<NotificationPrefs>(initialNotifications);

  // Re-sync if parent re-renders with fresh data (e.g. navigation back to tab)
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications.emailNotifications, initialNotifications.marketingEmails, initialNotifications.pushNotifications]);

  const sections = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security",      label: "Security",      icon: Shield },
    { id: "appearance",    label: "Appearance",    icon: Palette },
    { id: "advanced",      label: "Advanced",      icon: Key },
  ];

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  // ── Theme ──────────────────────────────────────────────────────
  function applyTheme(t: string) {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else if (t === 'light') root.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches)
        root.classList.add('dark');
      else
        root.classList.remove('dark');
    }
  }

  function handleThemeChange(t: string) {
    setTheme(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
    showMsg('success', `Theme changed to ${t}`);
  }

  useEffect(() => {
    if (theme) applyTheme(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // ── Password ───────────────────────────────────────────────────
  async function handlePasswordUpdate() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showMsg('error', 'Please fill in all password fields'); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMsg('error', 'New passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      showMsg('error', 'New password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', 'Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMsg('error', data.error || 'Failed to update password');
      }
    } catch {
      showMsg('error', 'An error occurred while updating password');
    } finally {
      setLoading(false);
    }
  }

  // ── Notifications ──────────────────────────────────────────────
  async function handleNotificationSave() {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });
      if (res.ok) {
        showMsg('success', 'Notification settings saved');
      } else {
        showMsg('error', 'Failed to save notification settings');
      }
    } catch {
      showMsg('error', 'An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  }

  // ── Export ─────────────────────────────────────────────────────
  async function handleExportData() {
    setLoading(true);
    try {
      const res = await fetch('/api/user/export-data');
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), {
          href: url,
          download: `hustlecare-data-${user.email}-${new Date().toISOString().slice(0, 10)}.json`,
          style: 'display:none',
        });
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMsg('success', 'Data exported successfully');
      } else {
        showMsg('error', 'Failed to export data');
      }
    } catch {
      showMsg('error', 'An error occurred while exporting data');
    } finally {
      setLoading(false);
    }
  }

  // ── Delete account ─────────────────────────────────────────────
  async function handleDeleteAccount() {
    setLoading(true);
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
      if (res.ok) {
        showMsg('success', 'Account deleted successfully');
        setTimeout(() => router.push('/'), 2000);
      } else {
        const data = await res.json();
        showMsg('error', data.error || 'Failed to delete account');
      }
    } catch {
      showMsg('error', 'An error occurred while deleting account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Section renderers ──────────────────────────────────────────
  function renderNotifications() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Notification Preferences
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Control which emails Hustlecare sends to you.
          </p>
          <div className="space-y-3">
            {([
              {
                key: 'emailNotifications' as const,
                label: 'Email Notifications',
                description: 'Receive important account notifications by email',
                note: null,
              },
              {
                key: 'marketingEmails' as const,
                label: 'Marketing & Updates',
                description: 'New features, business ideas, and promotions',
                note: 'You can also unsubscribe via the link in any marketing email.',
              },
              {
                key: 'pushNotifications' as const,
                label: 'Push Notifications',
                description: 'Browser push notifications (coming soon)',
                note: null,
              },
            ]).map(({ key, label, description, note }) => (
              <div
                key={key}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                  {note && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{note}</p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={e => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="sr-only peer"
                    disabled={key === 'pushNotifications'}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed" />
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
          {loading ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    );
  }

  function renderSecurity() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Change Password
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose a strong password of at least 8 characters.
          </p>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="New password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Confirm new password"
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
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    );
  }

  function renderAppearance() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Theme Preference
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose how Hustlecare looks for you.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {([
              { value: 'light',  label: 'Light',  icon: Sun },
              { value: 'dark',   label: 'Dark',   icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderAdvanced() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Management
          </h3>
          <div className="space-y-4">
            {/* Export */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Export Your Data</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Download a copy of your profile, carts, reviews, and search history.
              </p>
              <button
                onClick={handleExportData}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Exporting…' : 'Export Data'}
              </button>
            </div>

            {/* Delete */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-900 dark:text-red-400 mb-1">Delete Account</h4>
              <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                Permanently delete your account and all associated data. This cannot be undone.
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
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {loading ? 'Deleting…' : 'Yes, delete my account'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
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
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar nav */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                  activeSection === id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {activeSection === 'notifications' && renderNotifications()}
            {activeSection === 'security'      && renderSecurity()}
            {activeSection === 'appearance'    && renderAppearance()}
            {activeSection === 'advanced'      && renderAdvanced()}
          </div>
        </div>
      </div>
    </div>
  );
}