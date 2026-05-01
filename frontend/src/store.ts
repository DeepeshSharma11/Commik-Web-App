import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AppState {
  token: string | null;
  role: string | null;
  theme: 'light' | 'dark';
  setToken: (token: string | null, role: string | null) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      theme: 'light',
      setToken: (token, role) => set({ token, role }),
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      }),
    }),
    {
      name: 'commilk-store',
      // Token in sessionStorage (cleared on tab/browser close)
      // Theme in localStorage so it persists across sessions
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          const session = sessionStorage.getItem(key);
          const local = localStorage.getItem(key);
          if (session) return session;
          // Migrate theme from localStorage if session is empty
          return local;
        },
        setItem: (key, value) => {
          try {
            const parsed = JSON.parse(value);
            // Keep token/role only in sessionStorage (not persistent)
            const sessionData = { state: { token: parsed.state?.token, role: parsed.state?.role } };
            sessionStorage.setItem(key, JSON.stringify(sessionData));
            // Keep theme in localStorage (safe, not sensitive)
            const localData = { state: { theme: parsed.state?.theme } };
            localStorage.setItem(key + '-theme', JSON.stringify(localData));
          } catch {
            sessionStorage.setItem(key, value);
          }
        },
        removeItem: (key) => {
          sessionStorage.removeItem(key);
          localStorage.removeItem(key + '-theme');
        },
      })),
    }
  )
)
