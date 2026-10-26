"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { GameRoom, Player } from "@/lib/types";
import { retroAudio } from "@/lib/audio";
import {
  Trophy,
  FileText,
  Copy,
  Check,
  Users,
  Play,
  RotateCcw,
  WifiOff,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Info,
  LogOut,
} from "lucide-react";

export default function HomePage() {
  // Lobi Durumu
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticGrid, setOptimisticGrid] = useState<number[]>([]); // İyimser hamle güncellemeleri

  const eventSourceRef = useRef<EventSource | null>(null);

  // Tarayıcı yenilendiğinde odaya otomatik geri dönme (E5 Dayanıklılık kuralı)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNick = localStorage.getItem("pgc_nickname") || "";
      const savedCode = localStorage.getItem("pgc_room_code") || "";
      const savedPlayerId = localStorage.getItem("pgc_player_id") || "";

      if (savedNick) setNickname(savedNick);

      if (savedCode && savedPlayerId) {
        // Odayı geri yüklemeyi dene
        fetch(`/api/rooms/${savedCode}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.room) {
              const foundPlayer = data.room.players.find((p: Player) => p.id === savedPlayerId);
              if (foundPlayer) {
                setRoom(data.room);
                setMe(foundPlayer);
              }
            }
          })
          .catch(() => {
            // Oda düşmüş olabilir
            localStorage.removeItem("pgc_room_code");
            localStorage.removeItem("pgc_player_id");
          });
      }
    }
  }, []);

  // Ağ durumu izleme (E5: Bağlantı koparsa uyarı ve yeniden bağlanma)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // SSE Gerçek Zamanlı Oda Dinleyicisi
  useEffect(() => {
    if (!room?.code) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connectSSE = () => {
      const es = new EventSource(`/api/rooms/${room.code}/events`);
      eventSourceRef.current = es;

      es.addEventListener("room_update", (event) => {
        try {
          const updatedRoom: GameRoom = JSON.parse(event.data);
          setRoom(updatedRoom);

          // Kendi oyuncu durumunu güncelle
          if (me) {
            const updatedMe = updatedRoom.players.find((p) => p.id === me.id);
            if (updatedMe) setMe(updatedMe);
          }

          // Son 5 saniyede geri sayım sesi çal
          if (updatedRoom.status === "playing" && updatedRoom.remainingTime <= 5 && updatedRoom.remainingTime > 0) {
            retroAudio.playCountdownTick();
          }

          // Oyun bittiğinde zafer sesi çal
          if (updatedRoom.status === "finished" && room.status === "playing") {
            retroAudio.playGameOver();
          }
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      });

      es.onerror = () => {
        // SSE koptuğunda EventSource tarayıcı tarafından otomatik olarak yeniden denenir
        console.warn("SSE disconnected, reconnecting...");
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [room?.code, me?.id, room?.status]);

  // E1: 1. Adım Takma Ad Girişi, 2. Adım Oda Aç
  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setErrorMessage("Lütfen devam etmek için bir takma ad girin.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    retroAudio.playClick();

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", playerName: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Oda oluşturulamadı.");
      } else {
        setRoom(data.room);
        setMe(data.player);
        localStorage.setItem("pgc_nickname", nickname.trim());
        localStorage.setItem("pgc_room_code", data.room.code);
        localStorage.setItem("pgc_player_id", data.player.id);
      }
    } catch {
      setErrorMessage("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // E1: 2. Adım Koda Katıl
  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setErrorMessage("Lütfen önce bir takma ad girin.");
      return;
    }
    if (!joinCode.trim()) {
      setErrorMessage("Lütfen katılmak istediğiniz oda kodunu girin.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    retroAudio.playClick();

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          playerName: nickname.trim(),
          roomCode: joinCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Odaya katılınamadı.");
      } else {
        setRoom(data.room);
        setMe(data.player);
        localStorage.setItem("pgc_nickname", nickname.trim());
        localStorage.setItem("pgc_room_code", data.room.code);
        localStorage.setItem("pgc_player_id", data.player.id);
      }
    } catch {
      setErrorMessage("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Oda Kodunu Tek Tıkla Kopyala (E1 Kriteri)
  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setIsCopied(true);
      retroAudio.playClick();
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Hazır Olma Durumu Değiştirme
  const handleToggleReady = async () => {
    if (!room || !me) return;
    retroAudio.playClick();

    try {
      const res = await fetch(`/api/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ready", playerId: me.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      }
    } catch (err) {
      console.error("Toggle ready error:", err);
    }
  };

  // Hamle Yapma (Hücreye Tıklama - E4 İyimser Güncelleme & Ses)
  const handleCellClick = async (cellIndex: number) => {
    if (!room || !me || room.status !== "playing") return;

    const cell = room.grid[cellIndex];
    if (cell.ownerId === me.id) return; // Zaten benim hücrem

    // İyimser Güncelleme: Kendi ekranında hemen renklendir (E4)
    if (cell.type === "bonus") {
      retroAudio.playBonus();
    } else {
      retroAudio.playMove(cell.type === "glitch");
    }

    setOptimisticGrid((prev) => [...prev, cellIndex]);

    try {
      const res = await fetch(`/api/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", playerId: me.id, cellIndex }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      }
    } catch (err) {
      console.error("Cell click error:", err);
    }
  };

  // Klavyeyle oynama desteği (E6: Erişilebilirlik - Space/Enter tuşları)
  const handleCellKeyDown = (e: React.KeyboardEvent, cellIndex: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellClick(cellIndex);
    }
  };

  // Odadan Ayrılma
  const handleLeaveRoom = async () => {
    if (!room || !me) return;
    retroAudio.playClick();

    try {
      await fetch(`/api/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", playerId: me.id }),
      });
    } catch {
      // Yoksay
    } finally {
      localStorage.removeItem("pgc_room_code");
      localStorage.removeItem("pgc_player_id");
      setRoom(null);
      setMe(null);
    }
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    retroAudio.setMuted(nextMuted);
    if (!nextMuted) retroAudio.playClick();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
      {/* Üst Çubuk: Başlık, Bağlantı Uyarısı ve Hızlı Bağlantılar */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0 1.5rem 0", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Zap size={24} color="#00ffcc" />
          <span className="font-arcade" style={{ fontSize: "1.1rem", color: "#00ffcc", textShadow: "0 0 10px rgba(0, 255, 204, 0.5)" }}>
            PIXEL GRID CLASH
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={toggleSound}
            className="btn-arcade btn-secondary"
            title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            aria-label="Ses Kontrolü"
            style={{ padding: "0.5rem 0.75rem", minHeight: "44px", minWidth: "44px" }}
          >
            {isMuted ? <VolumeX size={18} color="#ff007f" /> : <Volume2 size={18} color="#00ffcc" />}
          </button>

          <Link href="/leaderboard" id="nav-leaderboard" className="btn-arcade btn-secondary" style={{ textDecoration: "none", fontSize: "0.7rem", padding: "0.5rem 0.9rem" }}>
            <Trophy size={14} /> Skor Tablosu
          </Link>

          <Link href="/rapor" id="nav-rapor" className="btn-arcade btn-secondary" style={{ textDecoration: "none", fontSize: "0.7rem", padding: "0.5rem 0.9rem" }}>
            <FileText size={14} /> Rapor
          </Link>
        </nav>
      </header>

      {/* Bağlantı Kopması Uyarısı (E5 Kuralı) */}
      {isOffline && (
        <div className="alert-banner alert-warning" id="offline-alert" role="alert">
          <WifiOff size={18} />
          <span>İnternet bağlantısı kesildi! Yeniden bağlanmaya çalışılıyor...</span>
        </div>
      )}

      {/* Hata Bildirimi */}
      {errorMessage && (
        <div className="alert-banner alert-error" id="error-alert" role="alert">
          <Info size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ANA İÇERİK: LOBİ VEYA AKTİF OYUN */}
      {!room ? (
        /* ================= LOBİ EKRANI (E1 Kriteri) ================= */
        <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div className="retro-card" style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 className="font-arcade" style={{ fontSize: "1.5rem", color: "#00ffcc", marginBottom: "0.5rem" }}>
                PIXEL GRID CLASH
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Retro Arcade Çok Oyunculu Kapışma (20 Saniyelik Turlar)
              </p>
            </div>

            {/* Kural okutmayan kısa 'Nasıl Oynanır' ipucu (E1 Kriteri) */}
            <div
              style={{
                background: "rgba(0, 255, 204, 0.08)",
                border: "1px dashed rgba(0, 255, 204, 0.4)",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "1.5rem",
                textAlign: "left",
                fontSize: "0.85rem",
                color: "#e0f8ff",
              }}
              id="how-to-play-tip"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", color: "#00ffcc", marginBottom: "4px" }}>
                <Sparkles size={16} /> NASIL OYNANIR (KISA İPUCU):
              </div>
              <div>
                20 saniyede ekrandaki piksellere tıklayarak kendi rengine çevir. Sarı hücreler <strong>+30 puan</strong> bonus verir. Süre bittiğinde en çok puanı toplayan raundu kazanır!
              </div>
            </div>

            {/* Adım 1: Takma Ad Girişi */}
            <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
              <label htmlFor="nickname-input" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "#00ffcc" }}>
                1. Takma Adınızı Seçin:
              </label>
              <input
                id="nickname-input"
                type="text"
                placeholder="Örn: PixelKing"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="retro-input"
                autoComplete="off"
              />
            </div>

            {/* Adım 2: Oda Aç veya Koda Katıl (En fazla 3 adım kuralı) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                id="btn-create-room"
                onClick={handleCreateRoom}
                disabled={isSubmitting || !nickname.trim()}
                className="btn-arcade btn-cyan"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Play size={16} /> Oda Aç (Yeni Oyun)
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.5rem 0" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>VEYA</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="room-code-input"
                  type="text"
                  placeholder="6 Haneli Oda Kodu"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="retro-input font-arcade"
                  style={{ textTransform: "uppercase", letterSpacing: "2px", textAlign: "center" }}
                />
                <button
                  id="btn-join-room"
                  onClick={handleJoinRoom}
                  disabled={isSubmitting || !nickname.trim() || !joinCode.trim()}
                  className="btn-arcade"
                  style={{ flexShrink: 0 }}
                >
                  Koda Katıl
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ================= OYUN ODASI EKRANI (E2, E3, E4, E6) ================= */
        <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Oda Başlığı & Oda Kodu Kopyalama (E1 Kriteri) */}
          <div className="retro-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>ODA KODU:</span>
              <span className="font-arcade" id="room-code-display" style={{ fontSize: "1.2rem", color: "#ffe600", letterSpacing: "2px" }}>
                {room.code}
              </span>
              <button
                id="btn-copy-code"
                onClick={handleCopyCode}
                className="btn-arcade btn-secondary"
                style={{ padding: "0.4rem 0.6rem", minHeight: "36px", minWidth: "36px" }}
                title="Oda Kodunu Kopyala"
                aria-label="Oda Kodunu Kopyala"
              >
                {isCopied ? <Check size={14} color="#00ffcc" /> : <Copy size={14} />}
                <span style={{ fontSize: "0.65rem" }}>{isCopied ? "Kopyalandı!" : "Kopyala"}</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={handleLeaveRoom}
                id="btn-leave-room"
                className="btn-arcade btn-secondary"
                style={{ fontSize: "0.65rem", padding: "0.4rem 0.75rem" }}
              >
                <LogOut size={14} /> Odadan Çık
              </button>
            </div>
          </div>

          {/* Oyuncu Listesi & Varlık Durumu (E3 Kriteri) */}
          <div className="retro-card" style={{ padding: "0.75rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <Users size={16} /> ODADAKİ OYUNCULAR ({room.players.length}/5):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }} id="player-list">
              {room.players.map((p) => {
                const isCurrentMe = p.id === me?.id;
                return (
                  <div
                    key={p.id}
                    id={`player-card-${p.name}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(10, 10, 25, 0.8)",
                      border: `1.5px solid ${p.color}`,
                      boxShadow: isCurrentMe ? `0 0 10px ${p.color}` : "none",
                    }}
                  >
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: p.color }} />
                    <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#fff" }}>
                      {p.name} {isCurrentMe && "(Sen)"}
                    </span>
                    <span className="font-arcade" style={{ fontSize: "0.75rem", color: "#ffe600" }}>
                      {p.score} PTS
                    </span>
                    {room.status === "waiting" && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: p.isReady ? "rgba(0, 255, 204, 0.2)" : "rgba(255, 255, 255, 0.1)",
                          color: p.isReady ? "#00ffcc" : "var(--text-muted)",
                        }}
                      >
                        {p.isReady ? "HAZIR" : "BEKLİYOR"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Oyun Durumu & Kalan Süre Sayacı (Kısıt: 20 saniye tur & E4 Kriteri) */}
          <div style={{ textAlign: "center", margin: "0.5rem 0" }}>
            {room.status === "waiting" && (
              <div>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.75rem", fontSize: "0.95rem" }} id="status-message">
                  {room.players.length < 2
                    ? "İkinci oyuncunun odaya katılması bekleniyor... (Oda kodunu arkadaşınızla paylaşın)"
                    : "Her iki oyuncu hazır olduğunda 20 saniyelik kapışma başlayacak!"}
                </p>
                <button
                  id="btn-ready-toggle"
                  onClick={handleToggleReady}
                  className={`btn-arcade ${me?.isReady ? "btn-secondary" : "btn-cyan"}`}
                  style={{ minWidth: "160px" }}
                >
                  {me?.isReady ? <RotateCcw size={16} /> : <Play size={16} />}
                  {me?.isReady ? "Hazırlığı İptal Et" : "Hazırım!"}
                </button>
              </div>
            )}

            {room.status === "playing" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>KALAN SÜRE</span>
                <div
                  id="countdown-timer"
                  className="font-arcade"
                  style={{
                    fontSize: "2.2rem",
                    color: room.remainingTime <= 5 ? "#ff007f" : "#00ffcc",
                    textShadow: room.remainingTime <= 5 ? "0 0 15px #ff007f" : "0 0 12px #00ffcc",
                    animation: room.remainingTime <= 5 ? "pulse-glitch 0.5s infinite alternate" : "none",
                  }}
                >
                  {room.remainingTime}s
                </div>
                {room.lastMoveInfo && (
                  <div style={{ fontSize: "0.8rem", color: "#ffe600", marginTop: "2px" }} id="last-move-indicator">
                    {room.lastMoveInfo.playerName} bir piksel ele geçirdi (+{room.lastMoveInfo.points} pts)
                  </div>
                )}
              </div>
            )}

            {room.status === "finished" && (
              <div style={{ padding: "1rem", background: "rgba(0, 255, 204, 0.1)", borderRadius: "8px", border: "1px solid #00ffcc" }}>
                <h2 className="font-arcade" style={{ fontSize: "1.3rem", color: "#ffe600", marginBottom: "0.5rem" }} id="winner-announcement">
                  {room.winner ? `🏆 KAZANAN: ${room.winner.name} (${room.winner.score} PTS)` : "BERABERE!"}
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Skorlar otomatik olarak canlı skor tablosuna kaydedildi!
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <button onClick={handleToggleReady} className="btn-arcade btn-cyan" id="btn-play-again">
                    <RotateCcw size={16} /> Tekrar Oyna
                  </button>
                  <Link href="/leaderboard" className="btn-arcade btn-secondary" style={{ textDecoration: "none" }}>
                    <Trophy size={16} /> Skorları İncele
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 4x4 Piksel Izgara (Pixel Grid Clash - E2 Eş Zamanlı Etkileşim & E6 375px/Klavye) */}
          <div className="pixel-grid" id="game-grid" role="grid" aria-label="Arcade Oyun Alanı">
            {room.grid.map((cell, index) => {
              const isOwnerMe = cell.ownerId === me?.id;
              const ownerPlayer = room.players.find((p) => p.id === cell.ownerId);
              const cellColor = ownerPlayer ? ownerPlayer.color : undefined;
              const isBonus = cell.type === "bonus";
              const isGlitch = cell.type === "glitch";

              return (
                <div
                  key={cell.id}
                  id={`cell-${index}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Hücre ${index + 1}, ${cell.points} puan, Sahibi: ${cell.ownerName || "Boş"}`}
                  onClick={() => handleCellClick(index)}
                  onKeyDown={(e) => handleCellKeyDown(e, index)}
                  className={`pixel-cell ${isBonus ? "bonus" : ""} ${isGlitch ? "glitch" : ""}`}
                  style={{
                    backgroundColor: cellColor ? `${cellColor}33` : undefined,
                    borderColor: cellColor || undefined,
                    boxShadow: cellColor ? `inset 0 0 12px ${cellColor}66` : undefined,
                  }}
                >
                  {isBonus && (
                    <span style={{ position: "absolute", top: "2px", right: "4px", fontSize: "0.6rem", color: "#ffe600", fontWeight: "bold" }}>
                      ★
                    </span>
                  )}
                  <span className="font-arcade" style={{ fontSize: "0.85rem", color: cellColor || "#8899aa" }}>
                    +{cell.points}
                  </span>
                  {cell.ownerName && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "#fff",
                        marginTop: "2px",
                        fontWeight: "bold",
                        maxWidth: "90%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isOwnerMe ? "SEN" : cell.ownerName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
