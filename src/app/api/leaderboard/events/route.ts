import { NextRequest } from "next/server";
import { leaderboardListeners } from "@/app/api/score/route";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  let removeListener: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`));

      const onUpdate = () => {
        try {
          controller.enqueue(
            encoder.encode(`event: update\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`)
          );
        } catch {
          // Bağlantı koptu
        }
      };

      leaderboardListeners.add(onUpdate);
      removeListener = () => {
        leaderboardListeners.delete(onUpdate);
      };

      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
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
