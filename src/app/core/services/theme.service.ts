import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'shopflow-theme';
  private readonly themeSubject = new BehaviorSubject<ThemeMode>(this.readStoredTheme());

  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  get isDarkMode(): boolean {
    return this.themeSubject.value === 'dark';
  }

  toggle(): void {
    this.setTheme(this.isDarkMode ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      // Ignore storage failures.
    }
  }

  private readStoredTheme(): ThemeMode {
    try {
      const storedTheme = localStorage.getItem(this.storageKey);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }

      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', theme === 'dark');
    root.style.colorScheme = theme;

    const body = document.body;
    body.classList.toggle('theme-dark', theme === 'dark');
    body.style.colorScheme = theme;
  }
}