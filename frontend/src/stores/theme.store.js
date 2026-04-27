import { create } from 'zustand';

// Read directly from localStorage — no persist middleware, no async hydration
function readDark() {
  try { return JSON.parse(localStorage.getItem('theme-dark')) === true; }
  catch { return false; }
}

function writeDark(val) {
  localStorage.setItem('theme-dark', JSON.stringify(val));
  document.documentElement.classList.toggle('dark', val);
}

export const useThemeStore = create((set, get) => ({
  dark: readDark(),
  toggle: () => {
    const next = !get().dark;
    writeDark(next);
    set({ dark: next });
  },
}));

// Clear old Zustand-persist key that may have stale dark:true
localStorage.removeItem('capstone-theme');

// Apply on module load (runs before React mounts)
writeDark(readDark());
