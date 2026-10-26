import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { roomsStore, createInitialGrid, generateRoomCode, broadcastRoomUpdate } from "@/lib/store";
import { GameRoom, Player } from "@/lib/types";

const PLAYER_COLORS = ["#00ffcc", "#ff007f", "#ffe600", "#00b4d8", "#9d4edd"];

const roomActionSchema = z.object({
  action: z.enum(["create", "join"]),
  playerName: z.string().min(2, "Takma ad en az 2 karakter olmalıdır").max(20),
  roomCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = roomActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek parametreleri", details: parsed.error.format() }, { status: 400 });
    }

    const { action, playerName, roomCode } = parsed.data;
    const playerId = "p_" + Math.random().toString(36).substring(2, 9);

    if (action === "create") {
      let code = generateRoomCode();
      while (roomsStore.has(code)) {
        code = generateRoomCode();
      }

      const creator: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        color: PLAYER_COLORS[0],
        isReady: false,
        lastActive: Date.now(),
      };

      const newRoom: GameRoom = {
        code,
        players: [creator],
        status: "waiting",
        roundDuration: 20,
        remainingTime: 20,
        startedAt: null,
        endedAt: null,
        grid: createInitialGrid(),
        winner: null,
      };

      roomsStore.set(code, newRoom);

      return NextResponse.json({
        success: true,
        room: newRoom,
        player: creator,
      });
    }

    if (action === "join") {
      if (!roomCode) {
        return NextResponse.json({ error: "Oda kodu belirtilmelidir." }, { status: 400 });
      }

      const cleanCode = roomCode.toUpperCase().trim();
      const room = roomsStore.get(cleanCode);

      if (!room) {
        return NextResponse.json({ error: "Belirtilen kodda bir oda bulunamadı. Lütfen kodu kontrol edin." }, { status: 404 });
      }

      if (room.players.length >= 5) {
        return NextResponse.json({ error: "Bu oda maksimum oyuncu kapasitesine (5 kişi) ulaşmıştır." }, { status: 403 });
      }

      const colorIndex = room.players.length % PLAYER_COLORS.length;
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        color: PLAYER_COLORS[colorIndex],
        isReady: false,
        lastActive: Date.now(),
      };

      room.players.push(newPlayer);
      roomsStore.set(cleanCode, room);

      broadcastRoomUpdate(room);

      return NextResponse.json({
        success: true,
        room,
        player: newPlayer,
      });
    }

    return NextResponse.json({ error: "Bilinmeyen eylem." }, { status: 400 });
  } catch (error) {
    console.error("Room creation/join error:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
