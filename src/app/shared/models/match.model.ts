import { Player } from './player.model';

export interface MatchDB {
  id: string;
  date: Date;
  teamA: Player[];
  teamB: Player[];
  teamAScore: number;
  teamBScore: number;
}
