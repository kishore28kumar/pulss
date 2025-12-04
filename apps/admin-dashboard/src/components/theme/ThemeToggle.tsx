'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'select';
  className?: string;
}

export default function ThemeToggle({ variant = 'button', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (variant === 'select') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <label htmlFor="theme-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    );
  }

  // Button variant - cycles through themes
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="w-5 h-5" />;
    } else if (theme === 'dark') {
      return <Moon className="w-5 h-5" />;
    } else {
      return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    if (theme === 'light') {
      return 'Light';
    } else if (theme === 'dark') {
      return 'Dark';
    } else {
      return 'System';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
      title={`Current: ${getLabel()} (Click to switch)`}
    >
      {getIcon()}
    </button>
  );
}

