export interface Player {
  id: string;
  name: string;
  playerNumber: number;
  role: 'Batsman' | 'Bowler' | 'Allrounder' | 'Wicketkeeper' | 'Custom';
  battingSkill: number;
  bowlingSkill: number;
  fieldingSkill: number;
  wicketkeepingSkill: number;
  overallScore?: number;
  createdAt: Date;
}
