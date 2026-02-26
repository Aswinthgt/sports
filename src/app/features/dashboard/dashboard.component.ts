import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { HistoryService } from '../../core/services/history.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="flex flex-col w-full pb-16">
      <!-- Hero Section -->
      <div class="relative pt-12 pb-24 border-b border-border-light overflow-hidden rounded-md flex items-center bg-surface-card w-full">
        <!-- Background Image overlay -->
        <div class="absolute inset-0 z-0 pointer-events-none" 
             style="background-image: linear-gradient(to right, var(--color-surface-card) 10%, transparent 60%), url('/assets/images/hero-batsman-bg.png'); background-size: cover; background-position: center 20%; opacity: 0.4;">
        </div>
        
        <div class="flex flex-col items-start max-w-3xl relative z-10 px-8">
          <div
            class="text-xs font-bold text-success-main uppercase tracking-widest mb-6 flex items-center gap-2"
          >
            <mat-icon class="scale-90">campaign</mat-icon> Smart Selection Algorithm
          </div>
          <h1 class="text-3xl md:text-5xl font-black mb-3 md:mb-4 leading-[1.1] tracking-tighter text-primary">
            Draft Perfect Cricket Teams in Seconds.
          </h1>
          <p class="text-secondary text-lg sm:text-xl mb-10 max-w-2xl font-medium leading-relaxed">
            Curate your roster, assign batting & bowling skills, and let our engine
            balance identical strength teams.
          </p>
          <button
            *ngIf="playerService.totalPlayers() >= 4"
            routerLink="/split"
            class="btn-primary text-base px-6 py-3"
          >
            Generate Match Now <mat-icon class="ml-2 scale-90">arrow_forward</mat-icon>
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-12">
        <!-- Players Stats -->
        <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-6">
            <mat-icon class="text-info-main text-2xl">groups</mat-icon>
            <span class="text-xs font-bold text-secondary uppercase tracking-widest">Master Roster</span>
          </div>
          
          <div class="flex items-end gap-3 mb-4">
            <span class="text-5xl md:text-6xl font-black text-primary leading-none tracking-tighter">{{
              playerService.totalPlayers()
            }}</span>
            <span class="text-lg md:text-xl text-secondary font-medium mb-1">players</span>
          </div>

          <p class="text-secondary text-base max-w-sm mb-6">
            Maintain your permanent database of players, their granular stats, and specific roles.
          </p>

          <p
            *ngIf="playerService.totalPlayers() < 4"
            class="text-warning-main text-sm font-semibold flex items-center gap-2"
          >
            <mat-icon class="text-base">error_outline</mat-icon>
            Need {{ 4 - playerService.totalPlayers() }} more to draft a match
          </p>
          <p
            *ngIf="playerService.totalPlayers() >= 4"
            class="text-success-main text-sm font-semibold flex items-center gap-2"
          >
            <mat-icon class="text-base">check_circle</mat-icon>
            Ready to organize a match!
          </p>

          <div class="flex gap-4 mt-auto pt-10">
            <button class="btn-primary flex-1 py-3 shadow-sm hover:-translate-y-0.5 transition-all" routerLink="/players">
              Manage Master List
            </button>
          </div>
        </div>

        <!-- Match History -->
        <div class="flex flex-col relative">
          <!-- Separator for mobile -->
          <div class="absolute -top-6 left-0 w-full h-px bg-border-light md:hidden"></div>
          <!-- Separator for desktop -->
          <div class="absolute -left-6 md:-left-8 top-0 w-px h-full bg-border-light hidden md:block"></div>

          <div class="flex items-center gap-3 mb-6">
            <mat-icon class="text-warning-main text-2xl">emoji_events</mat-icon>
            <span class="text-xs font-bold text-secondary uppercase tracking-widest">History</span>
          </div>
          
          <div class="flex items-end gap-3 mb-4">
            <span class="text-5xl md:text-6xl font-black text-primary leading-none tracking-tighter">{{
              historyService.totalMatches()
            }}</span>
            <span class="text-lg md:text-xl text-secondary font-medium mb-1">matches saved</span>
          </div>
          
          <p class="text-secondary text-base max-w-sm mb-6">
            Access your historical generated lineups to evaluate past team compositions.
          </p>

          <div class="mt-auto pt-12">
            <button class="btn-secondary w-full py-3" routerLink="/history">
              View Match Records
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class DashboardComponent {
  public playerService = inject(PlayerService);
  public historyService = inject(HistoryService);
}
