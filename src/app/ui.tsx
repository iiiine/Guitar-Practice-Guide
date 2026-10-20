import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { useSettings, type ThemePref } from './settingsStore';

/** 共用的小元件：開關、彈出面板、進度條、品牌標誌、主題切換。 */

export function Switch({ checked, onChange, label }: { checked: boolean; onChange(v: boolean): void; label: ReactNode }) {
  return (
    <label className="switch switch-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" />
    </label>
  );
}

export function Meter({ value }: { value: number }) {
  return (
    <div className="meter" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="meter-fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

/** 點按鈕打開、點外面或按 Esc 關閉。 */
export function Popover({ trigger, children }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="popover-anchor" ref={ref}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && <div className="popover">{children}</div>}
    </div>
  );
}

/** 品牌標誌：三條弦、兩條琴格、一個音符點。 */
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <path d="M6 10h20M6 16h20M6 22h20" stroke="var(--text-3)" strokeWidth="1.5" />
      <path d="M12 7v18M20 7v18" stroke="var(--border-strong)" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" fill="var(--accent)" />
    </svg>
  );
}

const THEME_ORDER: ThemePref[] = ['system', 'light', 'dark'];
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const;

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const Icon = THEME_ICON[theme];
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setTheme(next)}
      title={t('theme.switchTo', { name: t(`theme.${next}`) })}
    >
      <Icon size={15} />
      {t(`theme.${theme}`)}
    </button>
  );
}

/** 把主題偏好套到 <html data-theme>；system 時移除，交給 prefers-color-scheme。 */
export function useApplyTheme() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}
