import { AudioWaveform, BookOpen, CalendarCheck, ChartLine, Guitar, Library, type LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { t, type MessageKey } from '../i18n';
import { useNav, type Route } from './nav';
import { BluesPage } from './pages/BluesPage';
import { JamPage } from './pages/JamPage';
import { LessonPage } from './pages/LessonPage';
import { LessonsPage } from './pages/LessonsPage';
import { LibraryPage } from './pages/LibraryPage';
import { LogPage } from './pages/LogPage';
import { PracticePage } from './pages/PracticePage';
import { TodayPage } from './pages/TodayPage';
import { usePractice } from './practiceStore';
import { useSettings } from './settingsStore';
import { BrandMark, ThemeToggle, useApplyTheme } from './ui';

type NavEntry = { route: Route; label: MessageKey; icon: LucideIcon } | 'sep';

/** 學習 | 練習專區 | 紀錄 */
const NAV: NavEntry[] = [
  { route: { name: 'today' }, label: 'nav.today', icon: CalendarCheck },
  { route: { name: 'lessons' }, label: 'nav.lessons', icon: BookOpen },
  'sep',
  { route: { name: 'library' }, label: 'nav.library', icon: Library },
  { route: { name: 'jam' }, label: 'nav.jam', icon: AudioWaveform },
  { route: { name: 'blues' }, label: 'nav.blues', icon: Guitar },
  'sep',
  { route: { name: 'log' }, label: 'nav.log', icon: ChartLine },
];

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'today':
      return <TodayPage />;
    case 'lessons':
      return <LessonsPage />;
    case 'lesson':
      return <LessonPage key={route.id} id={route.id} />;
    case 'practice':
      return <PracticePage key={route.itemId} itemId={route.itemId} back={route.back} />;
    case 'library':
      return <LibraryPage />;
    case 'jam':
      return <JamPage />;
    case 'blues':
      return <BluesPage />;
    case 'log':
      return <LogPage />;
  }
}

export function App() {
  const route = useNav((s) => s.route);
  const go = useNav((s) => s.go);
  const loaded = usePractice((s) => s.loaded);
  useApplyTheme();

  useEffect(() => {
    void usePractice.getState().init();
    void useSettings.getState().init();
  }, []);

  const base = route.name === 'practice' ? route.back?.name ?? 'today' : route.name;
  const section = base === 'lesson' ? 'lessons' : base;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          {t('app.title')}
        </div>
        <nav className="nav">
          {NAV.map((n, i) => {
            if (n === 'sep') return <div key={i} className="nav-sep" aria-hidden />;
            const Icon = n.icon;
            return (
              <button
                key={n.route.name}
                className={`nav-item ${section === n.route.name ? 'active' : ''}`}
                onClick={() => go(n.route)}
              >
                <Icon size={16} />
                {t(n.label)}
              </button>
            );
          })}
        </nav>
        <div className="topbar-end">
          <ThemeToggle />
        </div>
      </header>
      <main className="content">{loaded ? <Page route={route} /> : null}</main>
    </div>
  );
}
