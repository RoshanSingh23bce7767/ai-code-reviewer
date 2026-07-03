import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isLocalHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const renderApiUrl = 'https://roshan-codeinsight-ai-api.onrender.com/api/v1';
  const localApiUrl = 'http://localhost:5050/api/v1';
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const apiUrl =
    configuredApiUrl && (isLocalHost || !configuredApiUrl.includes('localhost'))
      ? configuredApiUrl
      : isLocalHost
        ? localApiUrl
        : renderApiUrl;
  const aiModel = import.meta.env.VITE_AI_MODEL || 'gemini-2.5-flash-lite';

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'A clean, bright interface' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { id: 'system', label: 'System', icon: Monitor, desc: 'Follows your OS preference' },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Customize your experience</p>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Choose how the app looks to you</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon, desc }) => (
            <button key={id} onClick={() => setTheme(id)}
              className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: theme === id ? 'var(--primary)' : 'var(--border-app)',
                background: theme === id ? 'var(--primary)20' : 'var(--card-app)'
              }}>
              <Icon className="w-6 h-6" style={{ color: theme === id ? 'var(--primary)' : 'var(--text-secondary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              {theme === id && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border p-6 space-y-3" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>About</h2>
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Backend API</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{apiUrl}</span>
          </div>
          <div className="flex justify-between">
            <span>AI Model</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{aiModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
