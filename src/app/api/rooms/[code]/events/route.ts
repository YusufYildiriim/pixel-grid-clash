import { NextRequest } from "next/server";
import { roomsStore, roomListeners } from "@/lib/store";
import { GameRoom } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = code.toUpperCase();
  const room = roomsStore.get(cleanCode);

  if (!room) {
    return new Response(JSON.stringify({ error: "Oda bulunamadı" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let removeListener: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const initialPayload = JSON.stringify(room);
      controller.enqueue(encoder.encode(`event: room_update\ndata: ${initialPayload}\n\n`));

      let listeners = roomListeners.get(cleanCode);
      if (!listeners) {
        listeners = new Set();
        roomListeners.set(cleanCode, listeners);
      }

      const onRoomUpdate = (updatedRoom: GameRoom) => {
        try {
          controller.enqueue(
            encoder.encode(`event: room_update\ndata: ${JSON.stringify(updatedRoom)}\n\n`)
          );
        } catch {
          // Bağlantı koptu
        }
      };

      listeners.add(onRoomUpdate);
      removeListener = () => {
        const currentListeners = roomListeners.get(cleanCode);
        if (currentListeners) {
          currentListeners.delete(onRoomUpdate);
        }
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        if (removeListener) removeListener();
      });
    },
    cancel() {
      if (removeListener) removeListener();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
