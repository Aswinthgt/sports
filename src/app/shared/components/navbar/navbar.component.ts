import { Component, ElementRef, ViewChild, ViewChildren, QueryList, AfterViewInit, HostListener, inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <!-- Mobile Bottom Bar & Desktop Sidebar -->
    <nav class="fixed z-[60] backdrop-blur-xl border-border-light shadow-[0_-4px_24px_rgba(0,0,0,0.04)] md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300
                bottom-0 left-0 w-full h-[64px] border-t md:top-0 md:h-screen md:w-56 md:border-t-0 md:border-r md:flex md:flex-col md:py-6 md:px-4"
         style="background: var(--color-navbar-bg); border-color: var(--color-navbar-border);">
      
      <!-- Brand Logo (Desktop Only) -->
      <div class="hidden md:flex items-center gap-3 mb-8 px-2 cursor-pointer group" routerLink="/">
        <div class="bg-gradient-to-br from-primary-main to-secondary-main w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
          <mat-icon class="text-white scale-[0.8]">sports_cricket</mat-icon>
        </div>
        <span class="text-xl font-black tracking-tighter text-primary">SmartSplit</span>
      </div>

      <!-- Navigation Links -->
      <div class="flex h-full md:flex-1 items-center justify-evenly md:flex-col md:justify-start md:gap-2 px-2 md:px-0 relative" (mouseleave)="resetIndicator()">
        
        <!-- Sliding Background Indicator (Desktop Only) -->
        <div #indicator class="hidden md:block absolute z-0 rounded-sm transition-all duration-300 ease-out pointer-events-none opacity-0"
             style="left: 0; top: 0; transform: translate(0,0); width: 0; height: 0; background-color: var(--color-navbar-indicator);"></div>
        
        <a #navItem routerLink="/dashboard" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact: true}"
           (mouseenter)="moveIndicator($any($event).currentTarget)"
           class="nav-item relative z-10 flex flex-col items-center justify-center md:flex-row md:justify-start gap-1 md:gap-3 p-1 md:px-3 md:py-3 rounded-sm transition-colors flex-1 md:flex-none md:w-full h-full md:h-auto"
           style="color: var(--color-navbar-text);">
          <mat-icon class="transition-transform">dashboard</mat-icon>
          <span class="text-[10px] md:text-xs font-bold tracking-wide">Overview</span>
        </a>

        <a #navItem routerLink="/players" routerLinkActive="active-nav"
           (mouseenter)="moveIndicator($any($event).currentTarget)"
           class="nav-item relative z-10 flex flex-col items-center justify-center md:flex-row md:justify-start gap-1 md:gap-3 p-1 md:px-3 md:py-3 rounded-sm transition-colors flex-1 md:flex-none md:w-full h-full md:h-auto"
           style="color: var(--color-navbar-text);">
          <mat-icon class="transition-transform">people</mat-icon>
          <span class="text-[10px] md:text-xs font-bold tracking-wide">Roster</span>
        </a>

        <a #navItem routerLink="/split" routerLinkActive="active-nav"
           (mouseenter)="moveIndicator($any($event).currentTarget)"
           class="nav-item relative z-10 flex flex-col items-center justify-center md:flex-row md:justify-start gap-1 md:gap-3 p-1 md:px-3 md:py-3 rounded-sm transition-colors flex-1 md:flex-none md:w-full h-full md:h-auto"
           style="color: var(--color-navbar-text);">
          <mat-icon class="transition-transform">bolt</mat-icon>
          <span class="text-[10px] md:text-xs font-bold tracking-wide">Match</span>
        </a>

        <a #navItem routerLink="/history" routerLinkActive="active-nav"
           (mouseenter)="moveIndicator($any($event).currentTarget)"
           class="nav-item relative z-10 flex flex-col items-center justify-center md:flex-row md:justify-start gap-1 md:gap-3 p-1 md:px-3 md:py-3 rounded-sm transition-colors flex-1 md:flex-none md:w-full md:mt-2 h-full md:h-auto"
           style="color: var(--color-navbar-text);">
          <mat-icon class="transition-transform">history</mat-icon>
          <span class="text-[10px] md:text-xs font-bold tracking-wide">History</span>
        </a>

        <!-- Theme Toggle -->
        <button (click)="themeService.toggleTheme()" 
                class="relative z-10 flex flex-col items-center justify-center md:flex-row md:justify-start gap-1 md:gap-3 p-1 md:px-3 md:py-3 rounded-sm transition-colors flex-1 md:flex-none md:w-full md:mt-auto cursor-pointer border-none bg-transparent outline-none h-full md:h-auto"
                style="color: var(--color-navbar-text);">
          <mat-icon class="transition-transform">{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          <span class="text-[10px] md:text-xs font-bold tracking-wide text-center leading-tight">{{ themeService.isDarkMode() ? 'Light' : 'Dark' }}</span>
        </button>

      </div>
    </nav>
  `,
  styles: [`
    .nav-item, button { -webkit-tap-highlight-color: transparent; outline: none; }
    .nav-item:hover, button:hover { color: var(--color-navbar-text-hover) !important; }
    .active-nav { color: var(--color-navbar-active) !important; font-weight: 900; }
    .nav-item mat-icon { font-variation-settings: 'FILL' 0; transition: all 0.2s ease; }
    .active-nav mat-icon { font-variation-settings: 'FILL' 1; transform: scale(1.15); }
  `]
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('navItem') navItems!: QueryList<ElementRef>;
  @ViewChild('indicator') indicator!: ElementRef;

  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  public themeService = inject(ThemeService);
  private routerSub: any;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.resetIndicator(), 100);

      this.routerSub = this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        setTimeout(() => this.resetIndicator(), 50);
      });
    }
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.resetIndicator();
  }

  moveIndicator(target: HTMLElement) {
    if (!target || !this.indicator) return;

    // Use offsetLeft and offsetTop for extremely reliable relative positioning within the flex parent
    const left = target.offsetLeft;
    const top = target.offsetTop;
    const width = target.offsetWidth;
    const height = target.offsetHeight;

    this.indicator.nativeElement.style.opacity = '1';
    this.indicator.nativeElement.style.transform = `translate(${left}px, ${top}px)`;
    this.indicator.nativeElement.style.width = `${width}px`;
    this.indicator.nativeElement.style.height = `${height}px`;
  }

  resetIndicator() {
    if (!this.navItems) return;

    const activeItem = this.navItems.find(item => item.nativeElement.classList.contains('active-nav'));

    if (activeItem) {
      this.moveIndicator(activeItem.nativeElement);
    } else {
      if (this.indicator) {
        this.indicator.nativeElement.style.opacity = '0';
      }
    }
  }
}
