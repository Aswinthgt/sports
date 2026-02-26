import { Injectable } from '@angular/core';
import { Player } from '../../shared/models/player.model';

export interface TeamMetrics {
  totalScore: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgWicketkeeping: number;
  roleCounts: Record<string, number>;
  captain?: Player;
  viceCaptain?: Player;
}

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor() { }

  /**
   * Calculates overall score for a single player
   */
  calculateOverallScore(player: Player): number {
    return (player.battingSkill + player.bowlingSkill + player.fieldingSkill + player.wicketkeepingSkill) / 4;
  }

  /**
   * Prepares players by calculating overall scores and sorting descending
   */
  preparePlayers(players: Player[]): Player[] {
    return players
      .map((p) => ({ ...p, overallScore: this.calculateOverallScore(p) }))
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
  }

  /**
   * Generates two balanced teams using snake draft
   */
  generateTeams(players: Player[]): { teamA: Player[]; teamB: Player[] } {
    if (players.length < 4) {
      throw new Error('Minimum 4 players are required to generate teams.');
    }

    const sortedPlayers = this.preparePlayers(players);
    let teamA: Player[] = [];
    let teamB: Player[] = [];

    // Step 3: Snake Draft Distribution
    // Indices: 0(A), 1(B), 2(B), 3(A), 4(A), 5(B), 6(B)...
    sortedPlayers.forEach((player, index) => {
      const isTeamA = Math.floor(index / 2) % 2 === 0;
      if (index % 2 === 0) {
        isTeamA ? teamA.push(player) : teamB.push(player);
      } else {
        isTeamA ? teamB.push(player) : teamA.push(player);
      }
    });

    return { teamA, teamB };
  }

  /**
   * Reshuffles the team ignoring exact snake draft, mainly assigning randomly
   * but ensuring equal score distribution and role balances.
   */
  reshuffleTeams(players: Player[]): { teamA: Player[]; teamB: Player[] } {
    if (players.length < 4) {
      throw new Error('Minimum 4 players are required to shuffle teams.');
    }

    // Add a slight random noise to skills to change draft order
    const jitteredPlayers = players.map((p) => ({
      ...p,
      battingSkill: Math.min(100, Math.max(0, p.battingSkill + (Math.random() * 10 - 5))),
      bowlingSkill: Math.min(100, Math.max(0, p.bowlingSkill + (Math.random() * 10 - 5))),
      fieldingSkill: Math.min(100, Math.max(0, p.fieldingSkill + (Math.random() * 10 - 5))),
      wicketkeepingSkill: Math.min(100, Math.max(0, p.wicketkeepingSkill + (Math.random() * 10 - 5))),
    }));

    // We only use jittered for sorting, not mutating actual DB player objects
    const sortedJittered = this.preparePlayers(jitteredPlayers);
    const draftOrderIds = sortedJittered.map((jp) => jp.id);

    // Create actual sorted players using actual stats but random draft order
    const reshuffledSorted = draftOrderIds.map((id) => {
      const original = players.find((p) => p.id === id)!;
      return { ...original, overallScore: this.calculateOverallScore(original) };
    });

    let teamA: Player[] = [];
    let teamB: Player[] = [];

    reshuffledSorted.forEach((player, index) => {
      const isTeamA = Math.floor(index / 2) % 2 === 0;
      if (index % 2 === 0) {
        isTeamA ? teamA.push(player) : teamB.push(player);
      } else {
        isTeamA ? teamB.push(player) : teamA.push(player);
      }
    });

    return { teamA, teamB };
  }

  /**
   * Evaluates team and returns metrics
   */
  getTeamMetrics(team: Player[]): TeamMetrics {
    if (team.length === 0) {
      return {
        totalScore: 0,
        avgBatting: 0,
        avgBowling: 0,
        avgFielding: 0,
        avgWicketkeeping: 0,
        roleCounts: {},
      };
    }

    const roleCounts: Record<string, number> = {};
    for (const p of team) {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    }

    const totalBatting = team.reduce((sum, p) => sum + p.battingSkill, 0);
    const totalBowling = team.reduce((sum, p) => sum + p.bowlingSkill, 0);
    const totalFielding = team.reduce((sum, p) => sum + p.fieldingSkill, 0);
    const totalWicketkeeping = team.reduce((sum, p) => sum + p.wicketkeepingSkill, 0);

    const teamWithScores = team.map((p) => ({
      ...p,
      overallScore: p.overallScore || this.calculateOverallScore(p),
    }));
    const totalScore = teamWithScores.reduce((sum, p) => sum + p.overallScore, 0);

    const sortedForCaps = [...teamWithScores].sort((a, b) => b.overallScore - a.overallScore);
    const captain = sortedForCaps[0];
    const viceCaptain = sortedForCaps.length > 1 ? sortedForCaps[1] : undefined;

    return {
      totalScore: Number(totalScore.toFixed(2)),
      avgBatting: Number((totalBatting / team.length).toFixed(2)),
      avgBowling: Number((totalBowling / team.length).toFixed(2)),
      avgFielding: Number((totalFielding / team.length).toFixed(2)),
      avgWicketkeeping: Number((totalWicketkeeping / team.length).toFixed(2)),
      roleCounts,
      captain,
      viceCaptain,
    };
  }
}
