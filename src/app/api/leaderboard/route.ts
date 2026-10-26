import { NextRequest, NextResponse } from "next/server";
import { leaderboardStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");

  let scoresList = [...leaderboardStore];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("skorlar")
        .select("id, ad, skor, olusturma_zamani, oda_kodu");

      if (!error && data && data.length > 0) {
        scoresList = data.map((item) => ({
          id: item.id,
          ad: item.ad,
          skor: item.skor,
          zaman: item.olusturma_zamani,
          oda_kodu: item.oda_kodu,
        }));
      }
    } catch {
      // Supabase hatasında bellek içi skor havuzu kullanılır
    }
  }

  if (filter === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    scoresList = scoresList.filter((s) => new Date(s.zaman).getTime() >= todayStart.getTime());
  }

  const sorted = scoresList
    .sort((a, b) => {
      if (b.skor !== a.skor) {
        return b.skor - a.skor;
      }
      return new Date(a.zaman).getTime() - new Date(b.zaman).getTime();
    })
    .slice(0, 10)
    .map((item, index) => ({
      sira: index + 1,
      ad: item.ad,
      skor: item.skor,
      zaman: item.zaman,
    }));

  return NextResponse.json(
    {
      skorlar: sorted,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
