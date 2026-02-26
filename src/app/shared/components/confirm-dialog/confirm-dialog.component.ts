import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="p-8 pb-6 bg-surface-card rounded-2xl relative overflow-hidden">
      <!-- Decorator Line -->
      <div 
        class="absolute top-0 left-0 w-full h-1"
        [ngClass]="data.isDestructive ? 'bg-error-main' : 'bg-primary-main'">
      </div>

      <div class="flex items-start gap-5 mb-6">
        <div 
          class="w-12 h-12 shrink-0 rounded-full flex items-center justify-center border-4"
          [ngClass]="data.isDestructive ? 'bg-error-light/20 border-error-light text-error-dark' : 'bg-primary-light/20 border-primary-light text-primary-dark'">
          <mat-icon [class]="data.isDestructive ? 'scale-110' : ''">{{ data.isDestructive ? 'warning' : 'help_outline' }}</mat-icon>
        </div>
        
        <div class="pt-1">
          <h2 class="text-2xl font-black text-primary tracking-tight mb-2 m-0 leading-none">{{ data.title }}</h2>
          <p class="text-secondary text-base leading-relaxed m-0">{{ data.message }}</p>
        </div>
      </div>

      <div class="flex gap-3 justify-end mt-8 border-t border-border-light pt-6">
        <button 
          mat-button 
          class="!px-6 !py-2 !rounded-xl text-secondary hover:bg-surface-hover/50 transition-colors font-bold"
          (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          class="!px-6 !py-2 !rounded-xl font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          [ngClass]="data.isDestructive ? 'btn-primary !bg-error-main hover:!bg-error-dark' : 'btn-primary'"
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      /* Enforce border radius override for mat-dialog-container */
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) { }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
