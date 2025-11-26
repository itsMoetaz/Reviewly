import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          applyTheme(newTheme);
          return { theme: newTheme };
        }),
      
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

const stored = localStorage.getItem('theme-storage');
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    applyTheme(state.theme || 'light');
  } catch (e) {
    applyTheme('light');
  }
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  applyTheme('dark');
} else {
  applyTheme('light');
}
