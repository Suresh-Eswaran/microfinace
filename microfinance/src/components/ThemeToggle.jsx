import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      <span className="theme-toggle-track">
        <span className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <Moon size={14} className="theme-icon moon-icon" />
          ) : (
            <Sun size={14} className="theme-icon sun-icon" />
          )}
        </span>
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark Theme' : 'Light Theme'}
        </span>
      )}
    </button>
  );
}
