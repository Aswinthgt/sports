import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HistoryService } from '../../core/services/history.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatExpansionModule, MatDialogModule],
  template: `
    <div class="flex flex-col gap-12 w-full pb-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 pb-8 border-b border-border-light">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-primary tracking-tight mb-2">Match History</h1>
          <p class="text-secondary text-base">Record of previously generated balanced teams.</p>
        </div>
        <button
          class="btn-secondary border-error-main/20 text-error-dark hover:border-error-main font-semibold px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
          (click)="clearHistory()"
          [disabled]="historyService.totalMatches() === 0"
        >
          <mat-icon class="scale-90">delete_sweep</mat-icon> Clear All
        </button>
      </div>

      <div
        *ngIf="historyService.totalMatches() === 0"
        class="text-center py-16 mt-2"
      >
        <mat-icon class="text-5xl text-muted mb-4 opacity-50">history_toggle_off</mat-icon>
        <h3 class="text-2xl font-black text-primary tracking-tight mb-2">No match history found</h3>
        <p class="text-lg text-secondary font-medium">
          Generate and save a match to see it here.
        </p>
      </div>

      <mat-accordion class="flex flex-col gap-8">
        <mat-expansion-panel
          *ngFor="let match of historyService.matches(); let i = index"
          class="!p-0 overflow-hidden bg-transparent shadow-none border border-border-light rounded-sm mb-4"
        >
          <mat-expansion-panel-header
            class="h-auto py-4 px-6 hover:bg-surface-hover/50 transition-colors border-b border-border-light"
          >
            <mat-panel-title
              class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 align-middle m-0 flex-grow"
            >
              <div
                class="bg-surface-card border border-border-light text-primary px-4 py-2 rounded-sm text-xs tracking-widest uppercase font-black whitespace-nowrap w-fit"
              >
                Match {{ historyService.totalMatches() - i }}
              </div>
              <span class="text-secondary font-bold text-sm">{{
                match.date | date: 'medium'
              }}</span>
            </mat-panel-title>
            <mat-panel-description
              class="flex items-center gap-6 font-black text-xl w-full sm:justify-end m-0 mt-4 sm:mt-0"
            >
              <div class="flex items-center gap-4">
                <span class="text-info-main tracking-tighter">{{
                  match.teamAScore | number: '1.0-0'
                }}</span>
                <span class="text-muted text-sm font-bold tracking-widest uppercase">VS</span>
                <span class="text-success-main tracking-tighter">{{
                  match.teamBScore | number: '1.0-0'
                }}</span>
              </div>
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-app-background relative">
            <div class="hidden md:block absolute left-1/2 top-6 bottom-6 w-[1px] bg-border-light -ml-[0.5px]"></div>
            
            <!-- Team A -->
            <div>
              <h4
                class="text-xl font-black text-primary flex items-center justify-between pb-4 mb-2 border-b border-border-light"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-info-main w-3 h-3 rounded-sm"></div>
                  Team A
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-info-main tracking-tighter">{{ match.teamAScore | number: '1.0-0' }}</span>
                  <span class="text-[10px] text-muted tracking-widest uppercase font-bold mt-1">Total Score</span>
                </div>
              </h4>
              <ul class="flex flex-col">
                <li
                  *ngFor="let p of match.teamA"
                  class="flex justify-between items-center text-sm py-3 border-b border-border-light group"
                >
                  <span
                    class="font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis"
                    >{{ p.name }}</span
                  >
                  <div class="flex items-center gap-4">
                    <span
                      class="text-[10px] font-bold text-secondary uppercase tracking-widest text-right"
                      >{{ p.role }}</span
                    >
                    <span
                      class="font-black text-primary text-right w-8"
                      >{{ p.overallScore | number: '1.0-0' }}</span
                    >
                  </div>
                </li>
              </ul>
            </div>

            <!-- Team B -->
            <div>
              <h4
                class="text-xl font-black text-primary flex items-center justify-between pb-4 mb-2 border-b border-border-light"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-success-main w-3 h-3 rounded-sm"></div>
                  Team B
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-success-main tracking-tighter">{{ match.teamBScore | number: '1.0-0' }}</span>
                  <span class="text-[10px] text-muted tracking-widest uppercase font-bold mt-1">Total Score</span>
                </div>
              </h4>
              <ul class="flex flex-col">
                <li
                  *ngFor="let p of match.teamB"
                  class="flex justify-between items-center text-sm py-3 border-b border-border-light group"
                >
                  <span
                    class="font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis"
                    >{{ p.name }}</span
                  >
                  <div class="flex items-center gap-4">
                    <span
                      class="text-[10px] font-bold text-secondary uppercase tracking-widest text-right"
                      >{{ p.role }}</span
                    >
                    <span
                      class="font-black text-primary text-right w-8"
                      >{{ p.overallScore | number: '1.0-0' }}</span
                    >
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="px-8 py-5 border-t border-border-light flex justify-end bg-surface-hover/30">
            <button
              class="btn-secondary text-error-main hover:bg-error-light/20 border-transparent transition-colors py-2 px-6"
              (click)="deleteMatch(match.id)"
            >
              <mat-icon class="scale-90 mr-2">delete</mat-icon> Delete Record
            </button>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: ``,
})
export class HistoryComponent {
  public historyService = inject(HistoryService);
  private dialog = inject(MatDialog);

  async deleteMatch(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Match',
        message: 'Delete this match record permanently?',
        isDestructive: true,
        confirmText: 'Delete'
      } as ConfirmDialogData,
      width: '450px',
      panelClass: 'modern-dialog'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.historyService.deleteMatch(id);
    }
  }

  async clearHistory() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Clear History',
        message: 'Are you sure you want to clear ALL match history? This cannot be undone.',
        isDestructive: true,
        confirmText: 'Clear All'
      } as ConfirmDialogData,
      width: '450px',
      panelClass: 'modern-dialog'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.historyService.clearHistory();
    }
  }
}
