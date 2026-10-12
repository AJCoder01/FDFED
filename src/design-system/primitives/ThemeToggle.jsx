import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-control)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-ink-secondary)',
        cursor: 'pointer',
      }}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
