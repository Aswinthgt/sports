import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private document = inject(DOCUMENT);
    private platformId = inject(PLATFORM_ID);

    // Default is Dark Mode
    public isDarkMode = signal<boolean>(true);

    constructor() {
        this.initializeTheme();

        // Auto-update DOM classes whenever signal changes
        effect(() => {
            const darkNodeActive = this.isDarkMode();

            if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('theme', darkNodeActive ? 'dark' : 'light');

                if (darkNodeActive) {
                    this.document.documentElement.classList.remove('light');
                    this.document.documentElement.classList.add('dark');
                } else {
                    this.document.documentElement.classList.add('light');
                    this.document.documentElement.classList.remove('dark');
                }
            }
        });
    }

    private initializeTheme() {
        if (isPlatformBrowser(this.platformId)) {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme) {
                this.isDarkMode.set(storedTheme === 'dark');
            } else {
                this.isDarkMode.set(true); // Default
            }
        }
    }

    public toggleTheme() {
        this.isDarkMode.update(v => !v);
    }
}
