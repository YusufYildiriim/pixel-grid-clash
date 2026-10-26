import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { leaderboardStore, lastScoreTimestamps } from "@/lib/store";
import { getSupabaseAdminClient } from "@/lib/supabase";

// Zod şeması ile veri doğrulama (Rubrik L6)
const scoreSubmissionSchema = z.object({
  ad: z.string().min(2, "Takma ad en az 2 karakter olmalıdır").max(20, "Takma ad en fazla 20 karakter olabilir"),
  skor: z.number().int("Skor tamsayı olmalıdır").min(0, "Skor negatif olamaz").max(1000, "Mantıksız skor: 20 saniyelik bir turda azami 1000 puan alınabilir"),
  oda_kodu: z.string().min(4, "Oda kodu geçersiz"),
  playerId: z.string().optional(),
});

// SSE leaderboard dinleyicileri
type LeaderboardListener = () => void;
// eslint-disable-next-line no-var
declare global {
  // eslint-disable-next-line no-var
  var __leaderboardListeners: Set<LeaderboardListener> | undefined;
}
if (!global.__leaderboardListeners) {
  global.__leaderboardListeners = new Set<LeaderboardListener>();
}
export const leaderboardListeners = global.__leaderboardListeners;

export function notifyLeaderboardUpdate() {
  leaderboardListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Hata alan dinleyiciyi yoksay
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod Doğrulaması
    const parsed = scoreSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Doğrulama hatası",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { ad, skor, oda_kodu, playerId } = parsed.data;

    // 2. Mantıksız Skor Kontrolü (Ek kural kontrolü)
    if (skor < 0 || skor > 1000) {
      return NextResponse.json(
        {
          error: "Mantıksız skor reddedildi (0-1000 aralığı dışında).",
        },
        { status: 400 }
      );
    }

    // 3. 5 Saniye Kuralı (Spam / Hile Engelleme)
    const rateLimitKey = (playerId || ad).toLowerCase().trim();
    const now = Date.now();
    const lastTime = lastScoreTimestamps.get(rateLimitKey);

    if (lastTime && now - lastTime < 5000) {
      const waitTime = Math.ceil((5000 - (now - lastTime)) / 1000);
      return NextResponse.json(
        {
          error: `Aynı oyuncudan 5 saniye içinde gelen ikinci skor kabul edilmez. Lütfen ${waitTime} saniye bekleyin.`,
        },
        { status: 429 }
      );
    }

    lastScoreTimestamps.set(rateLimitKey, now);

    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      ad,
      skor,
      zaman: new Date().toISOString(),
      oda_kodu,
    };

    // Bellek içi depoya ekle
    leaderboardStore.push(newRecord);

    // Supabase Admin Client (Service Role Key) varsa veritabanına kaydet
    const supabaseAdmin = getSupabaseAdminClient();
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("skorlar").insert({
          ad: newRecord.ad,
          skor: newRecord.skor,
          oda_kodu: newRecord.oda_kodu,
          olusturma_zamani: newRecord.zaman,
        });

        // Supabase Realtime broadcast kanalına bildirim yayınla
        const channel = supabaseAdmin.channel("leaderboard-updates");
        await channel.send({
          type: "broadcast",
          event: "new-score",
          payload: { ad, skor },
        });
      } catch (err) {
        console.error("Supabase score insertion error:", err);
      }
    }

    // SSE dinleyicilerini tetikle
    notifyLeaderboardUpdate();

    return NextResponse.json(
      {
        success: true,
        message: "Skor başarıyla doğrulandı ve kaydedildi.",
        kayit: newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Score POST error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası nedeniyle skor kaydedilemedi." },
      { status: 500 }
    );
  }
}
