import { useState, useEffect } from 'react';
import { fireAPI } from '../services/api';
import type { UserPreferences } from '../types';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await fireAPI.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      const updated = await fireAPI.updatePreferences(data);
      setPreferences(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="text-center py-12">No preferences available</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">User Preferences</h2>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            Preferences saved successfully!
          </div>
        )}

        <div className="space-y-4">
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={preferences.currency}
              onChange={(e) => handleUpdate({ currency: e.target.value })}
              className="input"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select
              value={preferences.date_format}
              onChange={(e) => handleUpdate({ date_format: e.target.value })}
              className="input"
            >
              <option value="MMM dd, yyyy">MMM dd, yyyy (Jan 01, 2024)</option>
              <option value="dd/MM/yyyy">dd/MM/yyyy (01/01/2024)</option>
              <option value="MM/dd/yyyy">MM/dd/yyyy (01/01/2024)</option>
              <option value="yyyy-MM-dd">yyyy-MM-dd (2024-01-01)</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <div className="flex gap-4">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <label key={theme} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={theme}
                    checked={preferences.theme === theme}
                    onChange={() => handleUpdate({ theme })}
                    className="mr-2"
                  />
                  <span className="capitalize">{theme}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications_enabled}
                onChange={(e) => handleUpdate({ notifications_enabled: e.target.checked })}
                className="mr-2 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable notifications
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Receive notifications for important updates and reminders
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Financial Tracker</strong> - v1.0.0</p>
          <p>AI-powered transaction tracking with FIRE planning</p>
          <p className="pt-2 border-t border-gray-200">
            Features: Natural language input, recurring transactions, automatic categorization,
            FIRE retirement projections, investment tracking
          </p>
        </div>
      </div>
    </div>
  );
}
