import { Injectable, computed, inject, signal } from '@angular/core';
import { IndexeddbService } from './indexeddb.service';
import { MatchDB } from '../../shared/models/match.model';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private idbService = inject(IndexeddbService);

  // State
  private _matches = signal<MatchDB[]>([]);
  public matches = this._matches.asReadonly();

  public totalMatches = computed(() => this._matches().length);

  constructor() {
    this.loadMatches();
  }

  async loadMatches(): Promise<void> {
    const data = await this.idbService.getAllMatches();
    // Sort latest first
    const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this._matches.set(sorted);
  }

  async addMatch(match: MatchDB): Promise<void> {
    await this.idbService.addMatch(match);
    this._matches.update((matches) => [match, ...matches]);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.idbService.deleteMatch(id);
    this._matches.update((matches) => matches.filter((m) => m.id !== id));
  }

  async clearHistory(): Promise<void> {
    await this.idbService.clearMatches();
    this._matches.set([]);
  }
}
