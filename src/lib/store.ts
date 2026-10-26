import { GameRoom, LeaderboardEntry, GridCell } from "./types";

// Oda dinleyici havuzları
export type RoomListener = (room: GameRoom) => void;

// Bellek içi oda ve skor havuzu (Sunucu tarafı tekil nesne)
declare global {
  // eslint-disable-next-line no-var
  var __gameRooms: Map<string, GameRoom> | undefined;
  // eslint-disable-next-line no-var
  var __leaderboardScores: LeaderboardEntry[] | undefined;
  // eslint-disable-next-line no-var
  var __lastScoreTimestamps: Map<string, number> | undefined; // L6: 5 saniye kuralı
  // eslint-disable-next-line no-var
  var __roomListeners: Map<string, Set<RoomListener>> | undefined;
}

if (!global.__gameRooms) {
  global.__gameRooms = new Map<string, GameRoom>();
}

if (!global.__lastScoreTimestamps) {
  global.__lastScoreTimestamps = new Map<string, number>();
}

if (!global.__roomListeners) {
  global.__roomListeners = new Map<string, Set<RoomListener>>();
}

if (!global.__leaderboardScores) {
  global.__leaderboardScores = [
    { id: "1", sira: 1, ad: "PixelKing", skor: 580, zaman: new Date(Date.now() - 3600000 * 2).toISOString(), oda_kodu: "ARC80" },
    { id: "2", sira: 2, ad: "NeonShadow", skor: 510, zaman: new Date(Date.now() - 3600000 * 4).toISOString(), oda_kodu: "ARC81" },
    { id: "3", sira: 3, ad: "GlitchMaster", skor: 460, zaman: new Date(Date.now() - 3600000 * 6).toISOString(), oda_kodu: "ARC82" },
    { id: "4", sira: 4, ad: "CyberPulse", skor: 420, zaman: new Date(Date.now() - 3600000 * 8).toISOString(), oda_kodu: "ARC83" },
    { id: "5", sira: 5, ad: "RetroRacer", skor: 390, zaman: new Date(Date.now() - 3600000 * 12).toISOString(), oda_kodu: "ARC84" },
    { id: "6", sira: 6, ad: "BitHunter", skor: 340, zaman: new Date(Date.now() - 3600000 * 15).toISOString(), oda_kodu: "ARC85" },
    { id: "7", sira: 7, ad: "LaserViper", skor: 300, zaman: new Date(Date.now() - 3600000 * 18).toISOString(), oda_kodu: "ARC86" },
    { id: "8", sira: 8, ad: "TurboZap", skor: 270, zaman: new Date(Date.now() - 3600000 * 24).toISOString(), oda_kodu: "ARC87" },
    { id: "9", sira: 9, ad: "ArcadeHero", skor: 240, zaman: new Date(Date.now() - 3600000 * 30).toISOString(), oda_kodu: "ARC88" },
    { id: "10", sira: 10, ad: "PixelNova", skor: 190, zaman: new Date(Date.now() - 3600000 * 36).toISOString(), oda_kodu: "ARC89" },
    { id: "11", sira: 11, ad: "OldSchool", skor: 150, zaman: new Date(Date.now() - 3600000 * 48).toISOString(), oda_kodu: "ARC90" },
    { id: "12", sira: 12, ad: "ByteRider", skor: 110, zaman: new Date(Date.now() - 3600000 * 50).toISOString(), oda_kodu: "ARC91" },
  ];
}

export const roomsStore = global.__gameRooms;
export const leaderboardStore = global.__leaderboardScores;
export const lastScoreTimestamps = global.__lastScoreTimestamps;
export const roomListeners = global.__roomListeners;

export function broadcastRoomUpdate(room: GameRoom) {
  const listeners = roomListeners.get(room.code);
  if (listeners) {
    listeners.forEach((fn) => {
      try {
        fn(room);
      } catch {
        // Hatalı dinleyiciyi yoksay
      }
    });
  }
}

// 16'lık 4x4 Izgara oluşturucu (Retro Arcade Alanı)
export function createInitialGrid(): GridCell[] {
  const grid: GridCell[] = [];
  for (let i = 0; i < 16; i++) {
    // Bazı hücreler rastgele bonus veya glitch hücresi olur
    const rand = Math.random();
    let type: "normal" | "bonus" | "glitch" = "normal";
    let points = 10;
    if (rand > 0.8) {
      type = "bonus";
      points = 30;
    } else if (rand < 0.15) {
      type = "glitch";
      points = 20;
    }

    grid.push({
      id: i,
      ownerId: null,
      ownerName: null,
      points,
      type,
    });
  }
  return grid;
}

// 6 haneli benzersiz oda kodu üretici
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
