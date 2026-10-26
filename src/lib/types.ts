export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
  isReady: boolean;
  lastActive: number;
}

export interface GridCell {
  id: number;
  ownerId: string | null;
  ownerName: string | null;
  points: number;
  type: "normal" | "bonus" | "glitch";
}

export interface GameRoom {
  code: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
  roundDuration: number; // 20 saniye (Kısıt: Her tur 30 saniyeden kısa sürer)
  remainingTime: number;
  startedAt: number | null;
  endedAt: number | null;
  grid: GridCell[];
  currentTurnPlayerId?: string;
  winner: Player | null;
  lastMoveInfo?: {
    playerName: string;
    cellIndex: number;
    points: number;
    timestamp: number;
  };
}

export interface LeaderboardEntry {
  id?: string;
  sira?: number;
  ad: string;
  skor: number;
  zaman: string;
  oda_kodu?: string;
}
