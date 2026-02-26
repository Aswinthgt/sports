import { Injectable, computed, inject, signal } from '@angular/core';
import { IndexeddbService } from './indexeddb.service';
import { Player } from '../../shared/models/player.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private idbService = inject(IndexeddbService);

  // State
  private _players = signal<Player[]>([]);
  public players = this._players.asReadonly();

  public totalPlayers = computed(() => this._players().length);

  constructor() {
    this.loadPlayers();
  }

  async loadPlayers(): Promise<void> {
    const data = await this.idbService.getAllPlayers();
    // Sort by name for easier display
    const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
    this._players.set(sorted);
  }

  async addPlayer(player: Player): Promise<void> {
    await this.idbService.addPlayer(player);
    this._players.update((players) => {
      const updated = [...players, player];
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async addPlayers(players: Player[]): Promise<void> {
    await this.idbService.addPlayers(players);
    await this.loadPlayers();
  }

  async updatePlayer(player: Player): Promise<void> {
    await this.idbService.updatePlayer(player);
    this._players.update((players) => players.map((p) => (p.id === player.id ? player : p)));
  }

  async deletePlayer(id: string): Promise<void> {
    await this.idbService.deletePlayer(id);
    this._players.update((players) => players.filter((p) => p.id !== id));
  }

  async clearAllPlayers(): Promise<void> {
    await this.idbService.clearPlayers();
    this._players.set([]);
  }

  // Validation
  isDuplicateName(name: string, excludeId?: string): boolean {
    const lowerName = name.toLowerCase().trim();
    return this._players().some(
      (p) => p.name.toLowerCase().trim() === lowerName && p.id !== excludeId,
    );
  }

  isDuplicateNumber(playerNumber: number, excludeId?: string): boolean {
    return this._players().some(
      (p) => p.playerNumber === playerNumber && p.id !== excludeId,
    );
  }

  generateNextPlayerNumber(): number {
    const players = this._players();
    if (players.length === 0) return 1;
    return Math.max(...players.map(p => p.playerNumber)) + 1;
  }
}
