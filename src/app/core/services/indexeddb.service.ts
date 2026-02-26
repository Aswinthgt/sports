import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, IDBPDatabase } from 'idb';
import { Player } from '../../shared/models/player.model';
import { MatchDB } from '../../shared/models/match.model';

const DB_NAME = 'sports-db';
const DB_VERSION = 1;
const PLAYERS_STORE = 'players';
const MATCHES_STORE = 'matches';

@Injectable({
  providedIn: 'root',
})
export class IndexeddbService {
  private dbPromise: Promise<IDBPDatabase | undefined>;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.dbPromise = this.initDB();
    } else {
      this.dbPromise = Promise.resolve(undefined);
    }
  }

  private initDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PLAYERS_STORE)) {
          db.createObjectStore(PLAYERS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(MATCHES_STORE)) {
          db.createObjectStore(MATCHES_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  async getAllPlayers(): Promise<Player[]> {
    const db = await this.dbPromise;
    return db ? db.getAll(PLAYERS_STORE) : [];
  }

  async addPlayer(player: Player): Promise<string> {
    const db = await this.dbPromise;
    if (db) await db.put(PLAYERS_STORE, player);
    return player.id;
  }

  async addPlayers(players: Player[]): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(PLAYERS_STORE, 'readwrite');
    for (const player of players) {
      void tx.store.put(player);
    }
    await tx.done;
  }

  async updatePlayer(player: Player): Promise<string> {
    const db = await this.dbPromise;
    if (db) await db.put(PLAYERS_STORE, player);
    return player.id;
  }

  async deletePlayer(id: string): Promise<void> {
    const db = await this.dbPromise;
    if (db) await db.delete(PLAYERS_STORE, id);
  }

  async clearPlayers(): Promise<void> {
    const db = await this.dbPromise;
    if (db) await db.clear(PLAYERS_STORE);
  }

  // Matches Store Methods
  async getAllMatches(): Promise<MatchDB[]> {
    const db = await this.dbPromise;
    return db ? db.getAll(MATCHES_STORE) : [];
  }

  async addMatch(match: MatchDB): Promise<string> {
    const db = await this.dbPromise;
    if (db) await db.put(MATCHES_STORE, match);
    return match.id;
  }

  async deleteMatch(id: string): Promise<void> {
    const db = await this.dbPromise;
    if (db) await db.delete(MATCHES_STORE, id);
  }

  async clearMatches(): Promise<void> {
    const db = await this.dbPromise;
    if (db) await db.clear(MATCHES_STORE);
  }

  async clearDatabase(): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    await db.clear(PLAYERS_STORE);
    await db.clear(MATCHES_STORE);
  }
}
