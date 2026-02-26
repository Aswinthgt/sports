import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../shared/models/player.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="flex flex-col gap-8 pb-16 relative w-full h-full min-h-screen">
      
      <!-- Sticky Action Header -->
      <div class="sticky top-0 z-[40] bg-app-background/95 backdrop-blur-md pt-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-primary tracking-tight mb-2">Players</h1>
          <p class="text-secondary text-base">Manage your roster database effortlessly.</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3">
          <!-- Hidden Excel Input -->
          <input #fileInput type="file" accept=".xlsx, .xls" class="hidden" (change)="onFileChange($event)" />
          
          <button class="btn-secondary py-2 px-3 shadow-sm text-sm" (click)="downloadTemplate()">
            <mat-icon class="scale-75 mr-1 text-info-main">download</mat-icon> Template
          </button>
          
          <button class="btn-secondary py-2 px-3 shadow-sm text-sm" (click)="fileInput.click()">
            <mat-icon class="scale-75 mr-1 text-success-main">upload_file</mat-icon> Import Excel
          </button>
          
          <button class="btn-secondary py-2 px-3 shadow-sm text-sm" (click)="exportPlayers()">
            <mat-icon class="scale-75 mr-1 text-primary-main">ios_share</mat-icon> Export Data
          </button>
          
          <button class="btn-primary py-2 px-5 shadow-md flex items-center ml-auto md:ml-2" (click)="toggleForm()">
            <mat-icon class="scale-100 mr-2">{{ isFormOpen ? 'close' : 'add' }}</mat-icon>
            {{ isFormOpen ? 'Cancel' : 'Add Player' }}
          </button>
        </div>
      </div>

      <!-- Main Content Area: Grid -->
      <div class="flex flex-col gap-6 relative w-full">
        <!-- Dynamic Grid Roster -->
        <div class="w-full">
          
          <!-- Search Bar -->
          <div class="flex justify-end w-full mb-4 mt-2" *ngIf="playerService.players().length > 0">
            <div class="relative w-full sm:w-72 md:w-80 group">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10 scale-75 group-focus-within:text-primary-main transition-colors">search</mat-icon>
              <input type="text" [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)" 
                     placeholder="Search by name, number, role..." 
                     class="w-full bg-app-background hover:bg-surface-card border border-border-light rounded-sm py-2.5 pl-10 pr-10 text-sm text-primary font-medium focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/20 transition-all shadow-sm">
              <button *ngIf="searchQuery()" (click)="searchQuery.set('')" class="absolute right-1 top-1/2 -translate-y-1/2 text-muted hover:text-error-main transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-1 outline-none">
                 <mat-icon class="scale-75">close</mat-icon>
              </button>
            </div>
          </div>
          <div *ngIf="filteredPlayers().length === 0" class="text-center py-20 border-2 border-dashed border-border-light rounded-sm mx-auto w-full">
             <mat-icon class="text-6xl text-muted opacity-50 mb-4">person_search</mat-icon>
             <h3 class="text-2xl font-bold text-primary mb-2">No Players Found</h3>
             <p class="text-secondary mb-6">{{ searchQuery() ? 'No players match your search criteria.' : 'Your master roster is empty. Add a player or import an Excel template.' }}</p>
             <button *ngIf="!searchQuery()" class="btn-primary py-3" (click)="toggleForm()">Create First Player</button>
             <button *ngIf="searchQuery()" class="btn-secondary py-3" (click)="searchQuery.set('')">Clear Search</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 w-full" *ngIf="filteredPlayers().length > 0">
            
            <div *ngFor="let p of filteredPlayers()" 
                 class="bg-surface-card rounded-sm border border-border-light p-5 hover:shadow-md hover:border-primary-main/30 transition-all group flex flex-col relative h-[210px] justify-between">
              
              <!-- Card Header -->
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-sm bg-surface-hover flex items-center justify-center font-black text-primary-dark shadow-inner text-xs border border-border-light">
                    {{ p.playerNumber }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-primary text-base leading-tight truncate max-w-[140px]" title="{{ p.name }}">{{ p.name }}</span>
                    <span class="text-[10px] font-black uppercase tracking-widest"
                          [class.text-primary-main]="p.role === 'Batsman'"
                          [class.text-info-main]="p.role === 'Bowler'"
                          [class.text-success-main]="p.role === 'Allrounder'"
                          [class.text-warning-main]="p.role === 'Wicketkeeper'"
                          [class.text-secondary]="p.role === 'Custom'">
                      {{ p.role }}
                    </span>
                  </div>
                </div>
                
                <!-- Card Actions -->
                <div class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex flex-row items-center gap-2 absolute top-4 right-4">
                  <button (click)="editPlayer(p)" title="Edit Player" class="w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br from-primary-main to-secondary-main text-white shadow-md hover:shadow-lg transition-transform hover:scale-110 border-none cursor-pointer">
                    <mat-icon class="scale-[0.8]">edit</mat-icon>
                  </button>
                  <button (click)="deletePlayer(p.id)" title="Delete Player" class="w-8 h-8 rounded-sm flex items-center justify-center bg-gradient-to-br from-error-light to-error-main text-white shadow-md hover:shadow-lg transition-transform hover:scale-110 border-none cursor-pointer">
                    <mat-icon class="scale-[0.8]">delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Sparkline Stats -->
              <div class="flex flex-col gap-2.5 mt-auto border-t border-border-light pt-4">
                
                <div class="flex items-center gap-2">
                  <span class="text-[9px] w-6 font-bold text-muted uppercase">BAT</span>
                  <div class="flex-grow bg-surface-hover h-1.5 rounded-full overflow-hidden">
                    <div class="bg-primary-main h-full rounded-full" [style.width.%]="p.battingSkill"></div>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <span class="text-[9px] w-6 font-bold text-muted uppercase">BWL</span>
                  <div class="flex-grow bg-surface-hover h-1.5 rounded-full overflow-hidden">
                    <div class="bg-info-main h-full rounded-full" [style.width.%]="p.bowlingSkill"></div>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <span class="text-[9px] w-6 font-bold text-muted uppercase">FLD</span>
                  <div class="flex-grow bg-surface-hover h-1.5 rounded-full overflow-hidden">
                    <div class="bg-success-main h-full rounded-full" [style.width.%]="p.fieldingSkill"></div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[9px] w-6 font-bold text-muted uppercase">WK</span>
                  <div class="flex-grow bg-surface-hover h-1.5 rounded-full overflow-hidden">
                    <div class="bg-warning-main h-full rounded-full" [style.width.%]="p.wicketkeepingSkill"></div>
                  </div>
                </div>

              </div>
              
              <!-- Overall Score Pin -->
              <div class="absolute bottom-5 right-5 bg-gradient-to-br from-surface-hover to-surface-card border border-border-light px-2 py-1 rounded-sm flex flex-col items-center justify-center shadow-sm">
                 <span class="text-lg font-black text-primary leading-none">{{ p.overallScore | number: '1.0-1' }}</span>
                 <span class="text-[8px] font-bold text-muted uppercase tracking-widest mt-0.5">OVR</span>
              </div>

            </div>
            
          </div>
        </div>
      </div>

      <!-- Drawer Backdrop -->
      <div *ngIf="isFormOpen" 
           class="fixed inset-0 bg-app-background/60 backdrop-blur-sm z-[100] transition-all duration-300"
           (click)="toggleForm()">
      </div>

      <!-- Right Side Drawer -->
      <div class="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-surface-card shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border-light"
           [class.translate-x-full]="!isFormOpen"
           [class.translate-x-0]="isFormOpen">
        
        <div class="p-6 border-b border-border-light flex justify-between items-center bg-surface-hover/30">
          <h2 class="text-xl font-bold text-primary m-0 flex items-center gap-2">
            <mat-icon class="text-primary-main scale-90">{{ editingId ? 'edit' : 'person_add' }}</mat-icon>
            {{ editingId ? 'Update Profile' : 'New Player' }}
          </h2>
          <button (click)="toggleForm()" class="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-border-light/50 transition-colors text-muted hover:text-error-main cursor-pointer border-none bg-transparent">
            <mat-icon class="scale-90">close</mat-icon>
          </button>
        </div>

        <div class="flex-grow overflow-y-auto w-full p-6">
          <form [formGroup]="playerForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Player Name</mat-label>
              <input matInput formControlName="name" placeholder="E.g. Virat Kohli" />
              <mat-error *ngIf="playerForm.get('name')?.hasError('required')">Required</mat-error>
              <mat-error *ngIf="playerForm.get('name')?.hasError('duplicate')">Must be unique</mat-error>
            </mat-form-field>

            <div class="flex gap-4">
              <mat-form-field appearance="outline" class="w-1/2">
                <mat-label>Shirt #</mat-label>
                <input matInput type="number" formControlName="playerNumber" placeholder="Auto" />
                <mat-error *ngIf="playerForm.get('playerNumber')?.hasError('duplicate')">Exists</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-1/2">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="Batsman">Batsman</mat-option>
                  <mat-option value="Bowler">Bowler</mat-option>
                  <mat-option value="Allrounder">Allrounder</mat-option>
                  <mat-option value="Wicketkeeper">Wicketkeeper</mat-option>
                  <mat-option value="Custom">Custom</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Native Skill Sliders -->
            <div class="flex flex-col gap-6 mt-2">
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-sm font-bold">
                  <span class="text-secondary uppercase tracking-widest text-[10px]">Batting</span>
                  <span class="text-primary">{{ playerForm.get('battingSkill')?.value }}%</span>
                </div>
                <!-- Sliders to square corner requests! -->
                <input type="range" class="w-full accent-primary-main h-2 bg-border-light rounded-sm appearance-none cursor-pointer" formControlName="battingSkill" min="0" max="100" />
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-sm font-bold">
                  <span class="text-secondary uppercase tracking-widest text-[10px]">Bowling</span>
                  <span class="text-primary">{{ playerForm.get('bowlingSkill')?.value }}%</span>
                </div>
                <input type="range" class="w-full accent-info-main h-2 bg-border-light rounded-sm appearance-none cursor-pointer" formControlName="bowlingSkill" min="0" max="100" />
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-sm font-bold">
                  <span class="text-secondary uppercase tracking-widest text-[10px]">Fielding</span>
                  <span class="text-primary">{{ playerForm.get('fieldingSkill')?.value }}%</span>
                </div>
                <input type="range" class="w-full accent-success-main h-2 bg-border-light rounded-sm appearance-none cursor-pointer" formControlName="fieldingSkill" min="0" max="100" />
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-sm font-bold">
                  <span class="text-secondary uppercase tracking-widest text-[10px]">Wicketkeeping</span>
                  <span class="text-primary">{{ playerForm.get('wicketkeepingSkill')?.value }}%</span>
                </div>
                <input type="range" class="w-full accent-warning-main h-2 bg-border-light rounded-sm appearance-none cursor-pointer" formControlName="wicketkeepingSkill" min="0" max="100" />
              </div>
            </div>

            <button type="submit" class="btn-primary w-full py-3 mt-4 shadow-md text-base rounded-sm" [disabled]="playerForm.invalid">
              {{ editingId ? 'Save Edits' : 'Save To Roster' }}
            </button>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: ``,
})
export class PlayersComponent implements OnInit {
  playerForm: FormGroup;
  editingId: string | null = null;
  isFormOpen = false;
  displayedColumns: string[] = ['playerNumber', 'name', 'role', 'stats', 'actions'];

  searchQuery = signal('');

  filteredPlayers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const players = this.playerService.players();
    if (!query) return players;

    return players.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.playerNumber.toString().includes(query) ||
      p.role.toLowerCase().includes(query) ||
      p.battingSkill.toString().includes(query) ||
      p.bowlingSkill.toString().includes(query) ||
      p.fieldingSkill.toString().includes(query) ||
      p.wicketkeepingSkill.toString().includes(query) ||
      (p.overallScore !== undefined && p.overallScore.toString().includes(query))
    );
  });

  public playerService = inject(PlayerService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  constructor() {
    this.playerForm = this.fb.group({
      name: ['', Validators.required],
      playerNumber: [''],
      role: ['', Validators.required],
      battingSkill: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      bowlingSkill: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      fieldingSkill: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      wicketkeepingSkill: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  ngOnInit() {
    // Custom async-like validation for duplicate names
    this.playerForm.get('name')?.valueChanges.subscribe((name) => {
      if (typeof name === 'string' && name.trim().length > 0) {
        if (this.playerService.isDuplicateName(name, this.editingId || undefined)) {
          this.playerForm.get('name')?.setErrors({ duplicate: true });
        } else {
          // Keep other errors if they exist, else null
          const currentErrors = this.playerForm.get('name')?.errors;
          if (currentErrors) {
            delete currentErrors['duplicate'];
            this.playerForm
              .get('name')
              ?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
          }
        }
      }
    });

    this.playerForm.get('playerNumber')?.valueChanges.subscribe((num) => {
      if (num !== null && num !== '') {
        if (this.playerService.isDuplicateNumber(Number(num), this.editingId || undefined)) {
          this.playerForm.get('playerNumber')?.setErrors({ duplicate: true });
        } else {
          const currentErrors = this.playerForm.get('playerNumber')?.errors;
          if (currentErrors) {
            delete currentErrors['duplicate'];
            this.playerForm
              .get('playerNumber')
              ?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
          }
        }
      }
    });
  }

  async onSubmit() {
    if (this.playerForm.invalid) return;

    const formValue = this.playerForm.value;
    const finalNumber = (formValue.playerNumber == null || formValue.playerNumber === '')
      ? this.playerService.generateNextPlayerNumber()
      : Number(formValue.playerNumber);

    if (this.editingId) {
      // Update
      const updatedPlayer: Player = {
        id: this.editingId,
        name: formValue.name.trim(),
        playerNumber: finalNumber,
        role: formValue.role,
        battingSkill: Number(formValue.battingSkill),
        bowlingSkill: Number(formValue.bowlingSkill),
        fieldingSkill: Number(formValue.fieldingSkill),
        wicketkeepingSkill: Number(formValue.wicketkeepingSkill),
        createdAt: new Date(),
      };
      await this.playerService.updatePlayer(updatedPlayer);
      this.snackBar.open('Player updated successfully', 'Close', { duration: 3000 });
    } else {
      // Add

      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: formValue.name.trim(),
        playerNumber: finalNumber,
        role: formValue.role,
        battingSkill: Number(formValue.battingSkill),
        bowlingSkill: Number(formValue.bowlingSkill),
        fieldingSkill: Number(formValue.fieldingSkill),
        wicketkeepingSkill: Number(formValue.wicketkeepingSkill),
        createdAt: new Date(),
      };
      await this.playerService.addPlayer(newPlayer);
      this.snackBar.open('Player added successfully', 'Close', { duration: 3000 });
    }

    this.resetForm();
  }

  editPlayer(player: Player) {
    this.editingId = player.id;
    this.isFormOpen = true;
    this.playerForm.patchValue({
      name: player.name,
      playerNumber: player.playerNumber,
      role: player.role,
      battingSkill: player.battingSkill,
      bowlingSkill: player.bowlingSkill,
      fieldingSkill: player.fieldingSkill,
      wicketkeepingSkill: player.wicketkeepingSkill,
    });
    this.playerForm.get('name')?.updateValueAndValidity();
    this.playerForm.get('playerNumber')?.updateValueAndValidity();
  }

  async deletePlayer(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Player',
        message: 'Are you sure you want to delete this player?',
        isDestructive: true,
        confirmText: 'Delete'
      } as ConfirmDialogData,
      width: '450px',
      panelClass: 'modern-dialog'
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.playerService.deletePlayer(id);
      this.snackBar.open('Player deleted', 'Close', { duration: 3000 });
    }
  }

  resetForm() {
    this.editingId = null;
    this.isFormOpen = false;
    this.playerForm.reset({
      name: '',
      playerNumber: '',
      role: '',
      battingSkill: 50,
      bowlingSkill: 50,
      fieldingSkill: 50,
      wicketkeepingSkill: 50,
    });
  }

  async toggleForm() {
    if (this.isFormOpen && this.playerForm.dirty) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to close?',
          isDestructive: true,
          confirmText: 'Discard Changes'
        } as ConfirmDialogData,
        width: '450px',
        panelClass: 'modern-dialog'
      });
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        this.resetForm();
      }
    } else {
      this.isFormOpen = !this.isFormOpen;
      if (!this.isFormOpen) {
        this.resetForm();
      }
    }
  }

  // EXPORT / IMPORT LOGIC
  private readonly EXCEL_HEADERS = [
    'Player Name',
    'Player Number',
    'Role',
    'Batting %',
    'Bowling %',
    'Fielding %',
    'Wicketkeeping %'
  ];

  downloadTemplate() {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([this.EXCEL_HEADERS]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'player_template.xlsx');
  }

  exportPlayers() {
    const players = this.playerService.players();
    if (players.length === 0) {
      this.snackBar.open('Roster is empty. Nothing to export.', 'Close', { duration: 3000 });
      return;
    }

    const data = players.map(p => [
      p.name,
      p.playerNumber,
      p.role,
      p.battingSkill,
      p.bowlingSkill,
      p.fieldingSkill,
      p.wicketkeepingSkill
    ]);
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([this.EXCEL_HEADERS, ...data]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    XLSX.writeFile(wb, 'smartsplit_players.xlsx');
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      this.handleFile(target.files[0], target);
    }
  }

  handleFile(file: File, inputElement: HTMLInputElement) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.snackBar.open('Please upload a valid Excel file (.xlsx or .xls)', 'Close', { duration: 3000 });
      inputElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Extract strictly by matrix to enforce exact header validations
        const matrixData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (matrixData.length === 0) {
          throw new Error('File is completely empty.');
        }

        const headers = matrixData[0];
        if (headers.length !== 7 || headers.some((h, i) => h !== this.EXCEL_HEADERS[i])) {
          throw new Error('Invalid template format. Please use the exact provided template headers.');
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Import Action',
            message: 'Do you want to replace the entire Master List? Click Replace to overwrite, or Merge to add to existing players.',
            isDestructive: true,
            confirmText: 'Replace All',
            cancelText: 'Merge'
          } as ConfirmDialogData,
          width: '500px',
          panelClass: 'modern-dialog'
        });
        const isReplace = await firstValueFrom(dialogRef.afterClosed());
        if (isReplace) {
          await this.playerService.clearAllPlayers();
        }

        // Process rows avoiding empty
        let importedCount = 0;
        let duplicateCount = 0;

        for (let i = 1; i < matrixData.length; i++) {
          const row = matrixData[i];
          if (!row || row.length === 0) continue;

          let name = row[0];
          if (!name || typeof name !== 'string') continue;
          name = name.trim();
          if (name.length === 0) continue;

          // Duplicate name check
          if (this.playerService.isDuplicateName(name)) {
            duplicateCount++;
            continue;
          }

          let playerNumber = row[1] != null && row[1] !== '' ? Number(row[1]) : this.playerService.generateNextPlayerNumber();
          if (this.playerService.isDuplicateNumber(playerNumber)) {
            playerNumber = this.playerService.generateNextPlayerNumber();
          }

          const validRoles = ['Batsman', 'Bowler', 'Allrounder', 'Wicketkeeper', 'Custom'];
          let role = validRoles.includes(row[2]) ? row[2] : 'Custom';

          const parseFloatSkill = (val: any) => {
            if (val == null || val === '') return 50;
            const parsed = Number(val);
            if (isNaN(parsed) || parsed < 0 || parsed > 100) return 50;
            return parsed;
          }

          const newPlayer: Player = {
            id: crypto.randomUUID(),
            name: name,
            playerNumber: playerNumber,
            role: role as any,
            battingSkill: parseFloatSkill(row[3]),
            bowlingSkill: parseFloatSkill(row[4]),
            fieldingSkill: parseFloatSkill(row[5]),
            wicketkeepingSkill: parseFloatSkill(row[6]),
            createdAt: new Date(),
          };

          await this.playerService.addPlayer(newPlayer);
          importedCount++;
        }

        let resultMsg = `Successfully imported ${importedCount} players.`;
        if (duplicateCount > 0) resultMsg += ` Skipped ${duplicateCount} duplicates.`;
        this.snackBar.open(resultMsg, 'Close', { duration: 5000 });

      } catch (err: any) {
        this.snackBar.open(err.message, 'Close', { duration: 5000, panelClass: ['bg-error-main'] });
      } finally {
        // Always clear the input to allow re-upload of the same file
        inputElement.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }
}
