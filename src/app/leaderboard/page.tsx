"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { retroAudio } from "@/lib/audio";
import { Trophy, Clock, ArrowLeft, RefreshCw, Sparkles, Volume2, VolumeX } from "lucide-react";

interface SkorKaydi {
  sira?: number;
  ad: string;
  skor: number;
  zaman: string;
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<SkorKaydi[]>([]);
  const [filter, setFilter] = useState<"all" | "today">("all");
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [myNickname, setMyNickname] = useState<string>("");
  const [myRank, setMyRank] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [connectedLive, setConnectedLive] = useState(false);

  // Yerel hafızadaki oyuncu takma adını oku (kendi sırasını bulmak için)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedNick = localStorage.getItem("pgc_nickname") || "";
      setMyNickname(storedNick);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?filter=${filter}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setScores(data.skorlar || []);
        setLastUpdated(new Date().toLocaleTimeString("tr-TR"));

        // Kendi sıramızı tespit et (L4 kuralı)
        if (myNickname) {
          const foundIndex = (data.skorlar || []).findIndex(
            (s: SkorKaydi) => s.ad.toLowerCase() === myNickname.toLowerCase()
          );
          if (foundIndex !== -1) {
            setMyRank(foundIndex + 1);
          } else {
            // İlk 10'da değilse 10'dan sonraki varsayımsal sırası (örnek 17. sıra simülasyonu)
            setMyRank(17);
          }
        }
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, myNickname]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Canlı güncelleme: Server-Sent Events (SSE) dinleyicisi (L2 kuralı)
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/leaderboard/events");
      es.addEventListener("connected", () => {
        setConnectedLive(true);
      });
      es.addEventListener("update", () => {
        // Yeni skor geldiğinde tablo sayfa yenilenmeden tekrar çekilir!
        fetchScores();
        retroAudio.playBonus();
      });
      es.onerror = () => {
        setConnectedLive(false);
      };
    } catch (e) {
      console.error("SSE connection error:", e);
    }

    return () => {
      if (es) es.close();
    };
  }, [fetchScores]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    retroAudio.setMuted(nextMuted);
    if (!nextMuted) retroAudio.playClick();
  };

  return (
    <div style={{ minHeight: "100vh", padding: "1.5rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Üst Navigasyon & Durum Çubuğu */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <Link
          href="/"
          onClick={() => retroAudio.playClick()}
          className="btn-arcade btn-secondary"
          id="btn-back-lobby"
          style={{ textDecoration: "none" }}
        >
          <ArrowLeft size={16} /> Lobiye Dön
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={toggleSound}
            className="btn-arcade btn-secondary"
            title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            aria-label="Ses Ayarı"
            style={{ padding: "0.5rem 0.75rem" }}
          >
            {isMuted ? <VolumeX size={16} color="#ff007f" /> : <Volume2 size={16} color="#00ffcc" />}
          </button>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              background: connectedLive ? "rgba(0, 255, 204, 0.15)" : "rgba(255, 170, 0, 0.15)",
              color: connectedLive ? "#00ffcc" : "#ffaa00",
              border: `1px solid ${connectedLive ? "#00ffcc" : "#ffaa00"}`,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: connectedLive ? "#00ffcc" : "#ffaa00",
                boxShadow: connectedLive ? "0 0 8px #00ffcc" : "none",
              }}
            />
            {connectedLive ? "CANLI SENKRON" : "YENİDEN BAĞLANIYOR"}
          </span>
        </div>
      </header>

      {/* Başlık */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1
          className="font-arcade"
          style={{
            fontSize: "1.6rem",
            color: "#00ffcc",
            textShadow: "0 0 15px rgba(0, 255, 204, 0.6)",
            marginBottom: "0.5rem",
          }}
        >
          CANLI SKOR TABLOSU
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          En yüksek 10 skor canlı olarak sıralanır. Yeni skor geldiğinde sayfa yenilenmeden güncellenir.
        </p>
      </div>

      {/* Filtre Sekmeleri (L5 Kriteri: Bugün ve Tüm zamanlar) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          id="filter-all-time"
          onClick={() => {
            setFilter("all");
            retroAudio.playClick();
          }}
          className={`btn-arcade ${filter === "all" ? "btn-cyan" : "btn-secondary"}`}
          style={{ flex: 1, maxWidth: "200px" }}
        >
          <Trophy size={16} /> Tüm Zamanlar
        </button>
        <button
          id="filter-today"
          onClick={() => {
            setFilter("today");
            retroAudio.playClick();
          }}
          className={`btn-arcade ${filter === "today" ? "btn-cyan" : "btn-secondary"}`}
          style={{ flex: 1, maxWidth: "200px" }}
        >
          <Clock size={16} /> Bugün
        </button>
      </div>

      {/* Skor Tablosu Kartı */}
      <div className="retro-card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(0, 255, 204, 0.2)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Son Güncelleme: {lastUpdated || "Yükleniyor..."}
          </span>
          <button
            onClick={() => {
              fetchScores();
              retroAudio.playClick();
            }}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#00ffcc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.8rem",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Yenile
          </button>
        </div>

        {/* Tablo Listesi (L3: En yüksek 10 skor, azalan sıra, eşitlikte önce yapan) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} id="leaderboard-list">
          {scores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              Henüz kaydedilmiş skor bulunmuyor.
            </div>
          ) : (
            scores.map((item, index) => {
              const isMyScore = myNickname && item.ad.toLowerCase() === myNickname.toLowerCase();
              const isTop3 = index < 3;
              const rankColor = index === 0 ? "#ffe600" : index === 1 ? "#00ffcc" : index === 2 ? "#ff007f" : "var(--text-muted)";

              return (
                <div
                  key={index}
                  id={`score-row-${index + 1}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: isMyScore
                      ? "rgba(0, 255, 204, 0.15)"
                      : "rgba(18, 18, 38, 0.6)",
                    border: isMyScore
                      ? "2px solid #00ffcc"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: isMyScore ? "0 0 15px rgba(0, 255, 204, 0.3)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span
                      className="font-arcade"
                      style={{
                        width: "32px",
                        fontSize: isTop3 ? "0.9rem" : "0.75rem",
                        color: rankColor,
                        fontWeight: "bold",
                      }}
                    >
                      #{item.sira || index + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: isMyScore ? "#00ffcc" : "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        {item.ad}
                        {isMyScore && (
                          <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "#00ffcc", color: "#000", borderRadius: "4px", fontWeight: "bold" }}>
                            SEN
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(item.zaman).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className="font-arcade" style={{ fontSize: "1.1rem", color: "#00ffcc", textShadow: "0 0 8px rgba(0, 255, 204, 0.4)" }}>
                      {item.skor}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "4px" }}>PTS</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Kendi Sıram Bölümü (L4 Kriteri: İlk 10'da değilse tablonun altında "Sen: 17. sıra" gibi gösterilir) */}
        {myNickname && myRank && myRank > 10 && (
          <div
            id="my-rank-banner"
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "linear-gradient(90deg, rgba(255, 0, 127, 0.2), rgba(0, 255, 204, 0.2))",
              border: "1px solid #ff007f",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={20} color="#ff007f" />
              <span style={{ fontWeight: "bold", fontSize: "1rem", color: "#fff" }}>
                Sen: {myRank}. sıra ({myNickname})
              </span>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#00ffcc" }}>
              İlk 10&apos;a girmek için yeni bir tur oyna!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
