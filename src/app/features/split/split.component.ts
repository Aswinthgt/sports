import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { PlayerService } from '../../core/services/player.service';
import { TeamService } from '../../core/services/team.service';
import { HistoryService } from '../../core/services/history.service';
import { Player } from '../../shared/models/player.model';
import { MatchDB } from '../../shared/models/match.model';

@Component({
  selector: 'app-split',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    DragDropModule,
  ],
  template: `
    <div class="flex flex-col gap-6 w-full pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-6 pb-8 border-b border-border-light">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-primary tracking-tight mb-2">Create Match</h1>
          <p class="text-secondary text-base">
            {{ matchSelectionStep() ? 'Step 1: Select players for today\\'s match.' : 'Step 2: Generate balanced teams or manually swap players.' }}
          </p>
        </div>
        <div class="flex flex-wrap gap-4 w-full md:w-auto" *ngIf="!matchSelectionStep()">
          <button
            class="btn-secondary py-3"
            (click)="editSelection()"
          >
            <mat-icon class="scale-90 mr-2">arrow_back</mat-icon> Edit Selection
          </button>
          <button
            class="btn-secondary py-3"
            (click)="reshuffleTeams()"
            [disabled]="teamA().length === 0"
          >
            <mat-icon class="scale-90 mr-2">refresh</mat-icon> Reshuffle
          </button>
          <button
            class="btn-primary py-3"
            (click)="saveMatch()"
            [disabled]="teamA().length === 0"
          >
            <mat-icon class="scale-90 mr-2">save</mat-icon> Save Match
          </button>
        </div>
        <div class="flex w-full md:w-auto" *ngIf="matchSelectionStep()">
           <button
             class="btn-primary py-2 px-6 shadow-sm text-base flex items-center gap-2"
             (click)="proceedToSplit()"
             [disabled]="selectedPlayerIds().length < 4"
           >
             Next Step <mat-icon class="scale-90 ml-1">arrow_forward</mat-icon>
           </button>
        </div>
      </div>

      <!-- STEP 1: REQUIRES MINIMUM 4 PLAYERS IN ROSTER -->
      <div
        *ngIf="matchSelectionStep() && playerService.totalPlayers() < 4"
        class="py-16 text-center"
      >
        <mat-icon class="text-5xl text-warning-main mb-4 opacity-70">sports_cricket</mat-icon>
        <h2 class="text-2xl font-black mb-2 text-primary tracking-tight">You need at least 4 players!</h2>
        <p class="text-lg text-secondary mb-8 font-medium">
          Master Roster Size:
          <span class="text-primary font-black">{{ playerService.totalPlayers() }}</span> / Minimum 4
        </p>
        <button
          class="btn-primary py-3 px-8 shadow-sm text-base"
          (click)="router.navigate(['/players'])"
        >
          Manage Roster
        </button>
      </div>

      <!-- STEP 1: MATCH SELECTION TABLE -->
      <div *ngIf="matchSelectionStep() && playerService.totalPlayers() >= 4" class="flex flex-col gap-6">
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <h2 class="text-2xl font-bold text-primary m-0 whitespace-nowrap">Select Players</h2>
            
            <!-- Search Bar in the middle -->
            <div class="flex justify-center flex-grow w-full max-w-md" *ngIf="playerService.players().length > 0">
              <div class="relative w-full group">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10 scale-75 group-focus-within:text-primary-main transition-colors">search</mat-icon>
                <input type="text" [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)" 
                       placeholder="Search available players..." 
                       class="w-full bg-app-background hover:bg-surface-card border border-border-light rounded-sm py-2 pl-10 pr-10 text-sm text-primary font-medium focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/20 transition-all shadow-sm">
                <button *ngIf="searchQuery()" (click)="searchQuery.set('')" class="absolute right-1 top-1/2 -translate-y-1/2 text-muted hover:text-error-main transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-1 outline-none">
                   <mat-icon class="scale-75">close</mat-icon>
                </button>
              </div>
            </div>

            <div class="flex flex-wrap items-center lg:justify-end gap-4 whitespace-nowrap">
                <span class="text-secondary font-bold">{{ selectedPlayerIds().length }} Selected</span>
                <button class="btn-secondary py-2 px-3 shadow-sm text-sm" (click)="selectAll()">Select All</button>
                <button class="btn-secondary py-2 px-3 shadow-sm text-sm" (click)="clearSelection()">Clear All</button>
            </div>
        </div>
        
        <!-- Selection Warning Message -->
        <div *ngIf="selectedPlayerIds().length > 0 && selectedPlayerIds().length < 4" class="bg-warning-light/10 text-warning-dark p-4 rounded-xl text-sm font-semibold flex items-center border border-warning-light/30">
            <mat-icon class="mr-3 scale-110">warning</mat-icon>
            Please select at least 4 players to generate a match.
        </div>
        
        <!-- Selection Warning Message (moved up below header row) -->
        
        <div *ngIf="searchQuery() && filteredPlayers().length === 0" class="text-center py-12 border-2 border-dashed border-border-light rounded-sm mx-auto w-full text-secondary font-bold text-lg">
          No players match your search criteria.
        </div>

        <!-- Selection Grid Roster -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mt-2" *ngIf="filteredPlayers().length > 0">
          <div *ngFor="let p of filteredPlayers()" 
               class="relative bg-surface-card rounded-sm border p-3 md:p-4 transition-all cursor-pointer overflow-hidden group select-none flex flex-col items-center text-center justify-between"
               [ngClass]="isSelected(p.id) ? 'border-primary-main shadow-md transform scale-[1.02]' : 'border-border-light hover:border-primary-light hover:shadow-sm hover:scale-[1.01]'"
               (click)="toggleSelection(p.id)">
            
            <!-- Active State Gradient Background (Subtle) -->
            <div *ngIf="isSelected(p.id)" class="absolute inset-0 bg-primary-light/10 z-0 pointer-events-none"></div>

            <!-- Absolute Selection Indicator Badge -->
            <div class="absolute top-2 right-2 w-5 h-5 rounded-sm flex items-center justify-center transition-colors z-10"
                 [ngClass]="isSelected(p.id) ? 'bg-gradient-to-br from-primary-main to-secondary-main text-white shadow-sm' : 'bg-surface-hover border border-border-light text-transparent group-hover:border-primary-light'">
              <mat-icon class="scale-50 font-black">check</mat-icon>
            </div>

            <div class="z-10 flex flex-col items-center w-full mt-1">
              <div class="w-10 h-10 rounded-sm bg-surface-hover flex items-center justify-center font-black text-primary-dark shadow-inner text-base border border-border-light mb-2">
                {{ p.playerNumber }}
              </div>
              <span class="font-bold text-primary text-base sm:text-lg leading-tight w-full truncate px-2" title="{{ p.name }}">{{ p.name }}</span>
              <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1"
                    [class.text-primary-main]="p.role === 'Batsman'"
                    [class.text-info-main]="p.role === 'Bowler'"
                    [class.text-success-main]="p.role === 'Allrounder'"
                    [class.text-warning-main]="p.role === 'Wicketkeeper'"
                    [class.text-secondary]="p.role === 'Custom'">
                {{ p.role }}
              </span>
            </div>

            <!-- Stats Footer -->
            <div class="z-10 w-full mt-4 pt-4 border-t border-border-light flex justify-between items-end">
              <div class="flex flex-col items-start gap-1 w-full">
                <!-- Tiny progress bars for mobile -->
                <div class="w-full flex gap-1 h-1.5 rounded-sm overflow-hidden bg-surface-hover">
                   <div class="bg-primary-main h-full" [style.width.%]="p.battingSkill"></div>
                   <div class="bg-info-main h-full" [style.width.%]="p.bowlingSkill"></div>
                   <div class="bg-success-main h-full" [style.width.%]="p.fieldingSkill"></div>
                   <div class="bg-warning-main h-full" [style.width.%]="p.wicketkeepingSkill"></div>
                </div>
                <div class="flex justify-between w-full mt-1">
                   <span class="text-[8px] font-bold text-muted uppercase">BAT/BWL/FLD/WK</span>
                   <span class="text-xs font-black text-primary leading-none">{{ p.overallScore | number: '1.0-0' }} <span class="text-[8px] text-muted ml-0.5">OVR</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Generate button if min 4 and not generated -->
      <div
        *ngIf="!matchSelectionStep() && teamA().length === 0"
        class="flex justify-center my-20"
      >
        <button
          class="btn-primary px-12 py-6 text-2xl font-black rounded-sm flex items-center gap-3"
          (click)="generateInitialTeams()"
        >
          <mat-icon class="scale-150">bolt</mat-icon>
          Auto-Generate Balanced Teams
        </button>
      </div>

      <!-- Teams Display -->
      <div *ngIf="!matchSelectionStep() && teamA().length > 0 && teamB().length > 0" class="flex flex-col lg:flex-row gap-16 lg:gap-24 relative mt-8">
        <!-- VS Divider (Desktop) -->
        <div class="hidden lg:flex absolute left-1/2 top-0 bottom-0 -ml-[1px] w-[2px] bg-border-light">
          <div class="absolute top-32 left-1/2 -ml-6 bg-app-background px-2 py-4 text-border-light font-black text-2xl tracking-widest" style="writing-mode: vertical-rl;">
            VS
          </div>
        </div>

        <!-- TEAM A -->
        <div class="flex-1 flex flex-col">
          <!-- Team Header -->
          <div class="pb-8 mb-8 border-b border-border-light">
            <div class="flex justify-between items-start mb-6">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <div class="bg-info-main w-3 h-3 rounded-sm"></div>
                  <h2 class="text-3xl font-black text-primary tracking-tight m-0">Team A</h2>
                </div>
                <p class="text-[10px] text-info-main font-bold uppercase tracking-widest mt-2">
                  Avg Skill: {{ metricsA().avgBatting | number: '1.0-1' }}
                </p>
              </div>
              <div class="text-right">
                <span class="text-5xl font-black text-primary leading-none tracking-tighter">{{
                  metricsA().totalScore | number: '1.0-0'
                }}</span>
                <p class="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Total Score</p>
              </div>
            </div>

            <!-- Captains -->
            <div class="flex gap-4 text-xs font-bold text-primary mb-6">
              <div *ngIf="metricsA().captain" class="flex items-center gap-2">
                <span class="bg-primary hover:bg-primary-dark text-white px-1.5 py-0.5 rounded">C</span>
                {{ metricsA().captain?.name }}
              </div>
              <div *ngIf="metricsA().viceCaptain" class="flex items-center gap-2">
                <span class="bg-secondary text-primary-dark px-1.5 py-0.5 rounded">VC</span>
                {{ metricsA().viceCaptain?.name }}
              </div>
            </div>
          </div>

          <!-- Drag List A -->
          <div
            cdkDropList
            #teamAList="cdkDropList"
            [cdkDropListData]="teamA()"
            [cdkDropListConnectedTo]="[teamBList]"
            class="min-h-[400px] flex flex-col"
            (cdkDropListDropped)="drop($event)"
          >
            <div
              *ngFor="let p of teamA(); let i = index"
              cdkDrag
              (click)="handlePlayerClick('A', i)"
              class="py-3 sm:py-4 border-b border-border-light flex justify-between items-center hover:bg-surface-hover/50 transition-colors outline-none px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-sm bg-surface-card cursor-pointer"
              [class.ring-2]="selectedForSwap()?.team === 'A' && selectedForSwap()?.index === i"
              [class.ring-primary-main]="selectedForSwap()?.team === 'A' && selectedForSwap()?.index === i"
            >
              <div class="flex gap-2 sm:gap-4 items-center">
                <div cdkDragHandle class="cursor-grab active:cursor-grabbing p-2 sm:p-3 -ml-2 sm:-ml-4 mr-1 hover:bg-border-light/50 rounded-full transition-colors flex items-center justify-center touch-none hidden md:flex">
                  <mat-icon class="text-muted/70 hover:text-primary-main transition-colors">drag_indicator</mat-icon>
                </div>
                <!-- Player Info -->
                <div class="flex flex-col justify-center">
                  <div class="font-bold text-primary text-lg flex items-center gap-2">
                    <span class="text-muted text-sm tracking-widest leading-none">#{{ p.playerNumber }}</span>
                    <span>{{ p.name }}</span>
                  </div>
                  <div class="text-xs font-bold text-secondary uppercase tracking-widest mt-0.5">{{ p.role }}</div>
                </div>
              </div>
              <div class="flex items-center gap-6 text-right">
                <div class="hidden sm:flex text-[10px] gap-3 font-bold text-muted uppercase tracking-widest">
                  <span title="Batting">BT: {{ p.battingSkill | number:'1.0-0' }}</span>
                  <span title="Bowling">BW: {{ p.bowlingSkill | number:'1.0-0' }}</span>
                  <span title="Fielding">FD: {{ p.fieldingSkill | number:'1.0-0' }}</span>
                  <span title="Wicketkeeping">WK: {{ p.wicketkeepingSkill | number:'1.0-0' }}</span>
                </div>
                <div class="text-xl font-black text-primary w-12 text-right">
                  {{ p.overallScore | number: '1.0-0' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TEAM B -->
        <div class="flex-1 flex flex-col">
          <!-- Team Header -->
          <div class="pb-8 mb-8 border-b border-border-light">
            <div class="flex justify-between items-start mb-6">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <div class="bg-success-main w-3 h-3 rounded-full"></div>
                  <h2 class="text-3xl font-black text-primary tracking-tight m-0">Team B</h2>
                </div>
                <p class="text-[10px] text-success-main font-bold uppercase tracking-widest mt-2">
                  Avg Skill: {{ metricsB().avgBatting | number: '1.0-1' }}
                </p>
              </div>
              <div class="text-right">
                <span class="text-5xl font-black text-primary leading-none tracking-tighter">{{
                  metricsB().totalScore | number: '1.0-0'
                }}</span>
                <p class="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Total Score</p>
              </div>
            </div>

            <!-- Captains -->
            <div class="flex gap-4 text-xs font-bold text-primary mb-6">
              <div *ngIf="metricsB().captain" class="flex items-center gap-2">
                <span class="bg-primary hover:bg-primary-dark text-white px-1.5 py-0.5 rounded">C</span>
                {{ metricsB().captain?.name }}
              </div>
              <div *ngIf="metricsB().viceCaptain" class="flex items-center gap-2">
                <span class="bg-secondary text-primary-dark px-1.5 py-0.5 rounded">VC</span>
                {{ metricsB().viceCaptain?.name }}
              </div>
            </div>
          </div>

          <!-- Drag List B -->
          <div
            cdkDropList
            #teamBList="cdkDropList"
            [cdkDropListData]="teamB()"
            [cdkDropListConnectedTo]="[teamAList]"
            class="min-h-[400px] flex flex-col"
            (cdkDropListDropped)="drop($event)"
          >
            <div
              *ngFor="let p of teamB(); let i = index"
              cdkDrag
              (click)="handlePlayerClick('B', i)"
              class="py-3 sm:py-4 border-b border-border-light flex justify-between items-center hover:bg-surface-hover/50 transition-colors outline-none px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-sm bg-surface-card cursor-pointer"
              [class.ring-2]="selectedForSwap()?.team === 'B' && selectedForSwap()?.index === i"
              [class.ring-primary-main]="selectedForSwap()?.team === 'B' && selectedForSwap()?.index === i"
            >
              <div class="flex gap-2 sm:gap-4 items-center">
                <div cdkDragHandle class="cursor-grab active:cursor-grabbing p-2 sm:p-3 -ml-2 sm:-ml-4 mr-1 hover:bg-border-light/50 rounded-full transition-colors flex items-center justify-center touch-none hidden md:flex">
                  <mat-icon class="text-muted/70 hover:text-primary-main transition-colors">drag_indicator</mat-icon>
                </div>
                <!-- Player Info -->
                <div class="flex flex-col justify-center">
                  <div class="font-bold text-primary text-lg flex items-center gap-2">
                    <span class="text-muted text-sm tracking-widest leading-none">#{{ p.playerNumber }}</span>
                    <span>{{ p.name }}</span>
                  </div>
                  <div class="text-xs font-bold text-secondary uppercase tracking-widest mt-0.5">{{ p.role }}</div>
                </div>
              </div>
              <div class="flex items-center gap-6 text-right">
                <div class="hidden sm:flex text-[10px] gap-3 font-bold text-muted uppercase tracking-widest">
                  <span title="Batting">BT: {{ p.battingSkill | number:'1.0-0' }}</span>
                  <span title="Bowling">BW: {{ p.bowlingSkill | number:'1.0-0' }}</span>
                  <span title="Fielding">FD: {{ p.fieldingSkill | number:'1.0-0' }}</span>
                  <span title="Wicketkeeping">WK: {{ p.wicketkeepingSkill | number:'1.0-0' }}</span>
                </div>
                <div class="text-xl font-black text-primary w-12 text-right">
                  {{ p.overallScore | number: '1.0-0' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class SplitComponent {
  public playerService = inject(PlayerService);
  private teamService = inject(TeamService);
  private historyService = inject(HistoryService);
  private snackBar = inject(MatSnackBar);
  public router = inject(Router);

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

  // Match Context State
  matchSelectionStep = signal<boolean>(true);
  selectedPlayerIds = signal<string[]>([]);
  selectedForSwap = signal<{ team: 'A' | 'B', index: number } | null>(null);

  teamA = signal<Player[]>([]);
  teamB = signal<Player[]>([]);

  // Calculate metrics reactively based on team composition
  metricsA = computed(() => this.teamService.getTeamMetrics(this.teamA()));
  metricsB = computed(() => this.teamService.getTeamMetrics(this.teamB()));

  // Selection Logic
  isSelected(id: string): boolean {
    return this.selectedPlayerIds().includes(id);
  }

  toggleSelection(id: string) {
    this.selectedPlayerIds.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(playerId => playerId !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  selectAll() {
    const visibleIds = this.filteredPlayers().map(p => p.id);
    const current = this.selectedPlayerIds();
    const merged = Array.from(new Set([...current, ...visibleIds]));
    this.selectedPlayerIds.set(merged);
  }

  clearSelection() {
    this.selectedPlayerIds.set([]);
  }

  proceedToSplit() {
    if (this.selectedPlayerIds().length < 4) {
      this.snackBar.open('Please select at least 4 players for a match', 'Close', { duration: 3000 });
      return;
    }
    this.matchSelectionStep.set(false);
  }

  editSelection() {
    this.matchSelectionStep.set(true);
  }

  // Generation Logic
  generateInitialTeams() {
    try {
      // ONLY USE SELECTED PLAYERS
      const allPlayers = this.playerService.players();
      const matchPlayers = allPlayers.filter(p => this.selectedPlayerIds().includes(p.id));

      const { teamA, teamB } = this.teamService.generateTeams([...matchPlayers]);
      this.teamA.set(teamA);
      this.teamB.set(teamB);
      this.snackBar.open('Teams successfully generated and balanced!', 'Close', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(err.message, 'Close', { duration: 4000 });
    }
  }

  reshuffleTeams() {
    try {
      const allPlayers = this.playerService.players();
      const matchPlayers = allPlayers.filter(p => this.selectedPlayerIds().includes(p.id));

      const { teamA, teamB } = this.teamService.reshuffleTeams([...matchPlayers]);
      this.teamA.set(teamA);
      this.teamB.set(teamB);
      this.snackBar.open('Teams reshuffled!', 'Close', { duration: 2000 });
    } catch (err: any) {
      this.snackBar.open(err.message, 'Close', { duration: 4000 });
    }
  }

  drop(event: CdkDragDrop<Player[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same list
      const currentArray = [...event.container.data];
      moveItemInArray(currentArray, event.previousIndex, event.currentIndex);

      if (event.container.id === 'cdk-drop-list-0') {
        this.teamA.set(currentArray);
      } else {
        this.teamB.set(currentArray);
      }
    } else {
      // Swapping between lists (this strictly moves an item, breaking 11v11)
      // To keep 11v11, we implement a SWAP logic whenever dropped across
      // The dragged item index is event.previousIndex in event.previousContainer
      // The target dropped index is event.currentIndex in event.container

      const prevData = [...event.previousContainer.data];
      const currData = [...event.container.data];

      // Instead of transferArrayItem, we swap the item at previousIndex with item at currentIndex
      const incomingPlayer = prevData[event.previousIndex];
      const outgoingPlayer = currData[event.currentIndex];

      if (incomingPlayer && outgoingPlayer) {
        prevData[event.previousIndex] = outgoingPlayer;
        currData[event.currentIndex] = incomingPlayer;

        if (event.previousContainer.id === 'cdk-drop-list-0') {
          this.teamA.set(prevData);
          this.teamB.set(currData);
        } else {
          this.teamB.set(prevData);
          this.teamA.set(currData);
        }
      } else {
        // Fallback to normal transfer if for some reason indexes are out of bounds
        transferArrayItem(prevData, currData, event.previousIndex, event.currentIndex);
        if (event.previousContainer.id === 'cdk-drop-list-0') {
          this.teamA.set(prevData);
          this.teamB.set(currData);
        } else {
          this.teamB.set(prevData);
          this.teamA.set(currData);
        }
      }

      this.checkRoleWarnings();
    }
  }

  // Mobile Tap-to-Swap UX
  handlePlayerClick(team: 'A' | 'B', index: number) {
    const currentSelection = this.selectedForSwap();

    if (!currentSelection) {
      this.selectedForSwap.set({ team, index });
      this.snackBar.open(`Player selected. Tap a player in Team ${team === 'A' ? 'B' : 'A'} to swap.`, 'Dismiss', { duration: 2500 });
      return;
    }

    if (currentSelection.team === team) {
      if (currentSelection.index === index) {
        this.selectedForSwap.set(null);
      } else {
        this.selectedForSwap.set({ team, index });
      }
      return;
    }

    const indexA = team === 'A' ? index : currentSelection.index;
    const indexB = team === 'B' ? index : currentSelection.index;

    const newTeamA = [...this.teamA()];
    const newTeamB = [...this.teamB()];

    const playerA = newTeamA[indexA];
    const playerB = newTeamB[indexB];

    newTeamA[indexA] = playerB;
    newTeamB[indexB] = playerA;

    this.teamA.set(newTeamA);
    this.teamB.set(newTeamB);

    this.selectedForSwap.set(null);
    this.snackBar.open('Players swapped successfully!', 'Close', { duration: 2000, panelClass: ['bg-success-main', 'text-white'] });
  }

  private checkRoleWarnings() {
    let warnings = [];

    if (Math.abs(this.teamA().length - this.teamB().length) > 1) {
      warnings.push('Teams are highly uneven.');
    }

    if (warnings.length > 0) {
      this.snackBar.open('Warning: ' + warnings.join(' '), 'Dismiss', {
        duration: 5000,
        panelClass: ['bg-warning-main'],
      });
    }
  }

  async saveMatch() {
    const newMatch: MatchDB = {
      id: crypto.randomUUID(),
      date: new Date(),
      teamA: this.teamA(),
      teamB: this.teamB(),
      teamAScore: this.metricsA().totalScore,
      teamBScore: this.metricsB().totalScore,
    };

    await this.historyService.addMatch(newMatch);

    // Reset state after saving
    this.teamA.set([]);
    this.teamB.set([]);
    this.selectedPlayerIds.set([]);
    this.matchSelectionStep.set(true);

    this.snackBar
      .open('Match saved to history!', 'View History', { duration: 4000 })
      .onAction()
      .subscribe(() => {
        this.router.navigate(['/history']);
      });
  }
}
