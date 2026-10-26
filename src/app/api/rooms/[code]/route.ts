import { NextRequest, NextResponse } from "next/server";
import { roomsStore, createInitialGrid, broadcastRoomUpdate, leaderboardStore } from "@/lib/store";
import { notifyLeaderboardUpdate } from "@/app/api/score/route";
import { getSupabaseAdminClient } from "@/lib/supabase";

const playerMoveThrottles = new Map<string, number>();
const roomTimers = new Map<string, NodeJS.Timeout>();

function startRoomCountdown(code: string) {
  if (roomTimers.has(code)) {
    clearInterval(roomTimers.get(code));
  }

  const interval = setInterval(async () => {
    const room = roomsStore.get(code);
    if (!room || room.status !== "playing") {
      clearInterval(interval);
      roomTimers.delete(code);
      return;
    }

    if (room.remainingTime > 1) {
      room.remainingTime -= 1;
      roomsStore.set(code, room);
      broadcastRoomUpdate(room);
    } else {
      clearInterval(interval);
      roomTimers.delete(code);

      room.remainingTime = 0;
      room.status = "finished";
      room.endedAt = Date.now();

      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
      room.winner = sortedPlayers[0] || null;
      roomsStore.set(code, room);
      broadcastRoomUpdate(room);

      for (const p of room.players) {
        if (p.score > 0) {
          const newScore = {
            id: Math.random().toString(36).substring(2, 9),
            ad: p.name,
            skor: p.score,
            zaman: new Date().toISOString(),
            oda_kodu: code,
          };
          leaderboardStore.push(newScore);

          const supabase = getSupabaseAdminClient();
          if (supabase) {
            try {
              await supabase.from("skorlar").insert({
                ad: newScore.ad,
                skor: newScore.skor,
                oda_kodu: code,
                olusturma_zamani: newScore.zaman,
              });
            } catch {
              // Hata olursa bellek içi devam
            }
          }
        }
      }

      notifyLeaderboardUpdate();
    }
  }, 1000);

  roomTimers.set(code, interval);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = code.toUpperCase();
  const room = roomsStore.get(cleanCode);

  if (!room) {
    return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = code.toUpperCase();
  const room = roomsStore.get(cleanCode);

  if (!room) {
    return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { action, playerId } = body;

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1 && action !== "leave") {
      return NextResponse.json({ error: "Oyuncu odada bulunamadı" }, { status: 403 });
    }

    if (action === "ready") {
      const player = room.players[playerIndex];
      player.isReady = !player.isReady;

      if (room.status === "finished") {
        room.status = "waiting";
        room.remainingTime = 20;
        room.grid = createInitialGrid();
        room.winner = null;
        room.players.forEach((p) => {
          p.score = 0;
          if (p.id !== playerId) p.isReady = false;
        });
      }

      const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);
      if (allReady && room.status === "waiting") {
        room.status = "playing";
        room.startedAt = Date.now();
        room.remainingTime = 20;
        startRoomCountdown(cleanCode);
      }

      roomsStore.set(cleanCode, room);
      broadcastRoomUpdate(room);

      return NextResponse.json({ success: true, room });
    }

    if (action === "move") {
      if (room.status !== "playing") {
        return NextResponse.json({ error: "Oyun henüz başlamadı veya bitti." }, { status: 400 });
      }

      const now = Date.now();
      const lastMove = playerMoveThrottles.get(playerId) || 0;
      if (now - lastMove < 700) {
        return NextResponse.json({ error: "Hamle hızı aşıldı (en fazla saniyede 1 hamle)." }, { status: 429 });
      }
      playerMoveThrottles.set(playerId, now);

      const { cellIndex } = body;
      if (typeof cellIndex !== "number" || cellIndex < 0 || cellIndex >= 16) {
        return NextResponse.json({ error: "Geçersiz hücre indeksi." }, { status: 400 });
      }

      const cell = room.grid[cellIndex];
      const player = room.players[playerIndex];

      if (cell.ownerId === player.id) {
        return NextResponse.json({ error: "Bu hücre zaten sizin." }, { status: 400 });
      }

      const prevOwner = cell.ownerName;
      cell.ownerId = player.id;
      cell.ownerName = player.name;
      player.score += cell.points;

      room.lastMoveInfo = {
        playerName: player.name,
        cellIndex,
        points: cell.points,
        timestamp: now,
      };

      roomsStore.set(cleanCode, room);
      broadcastRoomUpdate(room);

      return NextResponse.json({
        success: true,
        room,
        capturedPoints: cell.points,
        prevOwner,
      });
    }

    if (action === "leave") {
      room.players = room.players.filter((p) => p.id !== playerId);
      if (room.players.length === 0) {
        if (roomTimers.has(cleanCode)) {
          clearInterval(roomTimers.get(cleanCode));
          roomTimers.delete(cleanCode);
        }
        roomsStore.delete(cleanCode);
      } else {
        roomsStore.set(cleanCode, room);
        broadcastRoomUpdate(room);
      }

      return NextResponse.json({ success: true, message: "Ayrıldınız" });
    }

    return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 });
  } catch (error) {
    console.error("Room action error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
