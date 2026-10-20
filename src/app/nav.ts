import { create } from 'zustand';

export type Route =
  | { name: 'today' }
  | { name: 'lessons' }
  | { name: 'lesson'; id: string }
  | { name: 'practice'; itemId: string; back?: Route }
  | { name: 'library' }
  | { name: 'jam' }
  | { name: 'blues' }
  | { name: 'log' };

interface NavState {
  route: Route;
  go(route: Route): void;
}

export const useNav = create<NavState>((set) => ({
  route: { name: 'today' },
  go(route) {
    set({ route });
    window.scrollTo?.(0, 0);
  },
}));
