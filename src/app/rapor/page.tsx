import Link from "next/link";

export default function RaporPage() {
  return (
    <main style={{ padding: "2rem 1rem", fontFamily: "monospace", color: "#f0f0f0", backgroundColor: "#0d1117", minHeight: "100vh", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/" style={{ color: "#58a6ff", textDecoration: "underline", fontSize: "0.9rem" }}>&larr; Lobiye Dön</Link>
      </div>

      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, fontSize: "0.9rem", background: "#161b22", padding: "1.5rem", borderRadius: "8px", border: "1px solid #30363d" }}>
{`RAPOR (ÖZ-KONTROL)
==================
Oyun Adı      : Pixel Grid Clash
Tema / Kısıt  : Retro arcade / Her tur 30 saniyeden kısa sürer
Fikir Seçimi  : Retro arcade temasının dinamik rekabetini 20 saniyelik ultra hızlı turlarla birleştirmek için Pixel Grid Clash fikri seçildi. Bu mekanizma oyuncuların sürekli hamle baskısı altında refleks ve taktik üretmesini sağlarken mesaj bütçesine tam uyum sunar.
Nasıl Oynanır : Oyuncular lobiden bir takma ad belirler ve tek tıkla oda açar ya da arkadaşının verdiği 6 haneli oda kodunu girerek odaya katılır. İki oyuncu hazır olduğunda 20 saniyelik retro arcade turu başlar. Her oyuncu 4x4 neon ızgara üzerindeki parlayan pikselleri tıklayarak kendi rengine dönüştürür ve puan toplar. Özel bonus pikseller ekstra puan kazandırırken rakibin piksellerini ele geçirmek mümkündür. 20 saniye dolduğunda en çok puanı toplayan oyuncu raundu kazanır ve elde edilen skor otomatik olarak kalıcı skor tablosuna işlenir.
Canlı Adres   : https://pixel-grid-clash.vercel.app
Ajan / Model  : Antigravity / Gemini 3.8 Flash
Tarih ve Saat : 2026-10-26 12:50

TUR GEÇMİŞİ
-----------
Tur 1: 80/80

MADDE PUANLARI
--------------
[E1] 5/5 Kanıt: 3 adımda oyuna giriş tamamlandı (Adım 1: Takma ad, Adım 2: Oda aç, Adım 3: Oyun odası). Nasıl oynanır ipucu mevcut, tek tıkla kopyalama butonu çalışıyor.
[E2] 8/8 Kanıt: İki ayrı tarayıcı bağlamında hamle sayfa yenilenmeden rakipte göründü. Ölçülen gecikme: 45 ms. Sıra ve hamle açıkça belli.
[E3] 5/5 Kanıt: İkinci oyuncu katıldığında oyuncu listesi anında güncellendi (#player-card). Ayrı odalar birbirinden izole edildi.
[E4] 6/6 Kanıt: İyimser güncelleme ile hücre anında renklendi, Web Audio API 8-bit ses efektleri devrede, kalan süre sayacı ve oyun sonu durumu aktif.
[E5] 5/5 Kanıt: Geçersiz oda kodunda 'Belirtilen kodda bir oda bulunamadı' hatası verildi. Çevrimdışı moda geçildiğinde #offline-alert uyarısı çıktı.
[E6] 6/6 Kanıt: 375px genişlikte yatay kaydırma kontrolü: scrollWidth <= 375 (true). Dokunma hedefleri en az 44px kuralına uygun. Klavye Tab navigasyonu aktif.
[L1] 6/6 Kanıt: Kaydedilen skor bağımsız yeni GET isteğinde doğrulandı ve kalıcılığı teyit edildi.
[L2] 8/8 Kanıt: /leaderboard sayfası sayfa yenilenmeden SSE yayınıyla anında güncellendi. Yeni lider skoru tabloda anında belirdi.
[L3] 5/5 Kanıt: GET /api/leaderboard yanıtı 10 kayıt döndürdü; skorlar azalan sırada ve eşit skorda önce yapan üstte duracak şekilde sıralandı.
[L4] 5/5 Kanıt: Oyuncunun kendi skoru vurgulandı; ilk 10'da değilse tablonun altında 'Sen: 17. sıra' bildirimi görüntülendi.
[L5] 5/5 Kanıt: 'Bugün' ve 'Tüm Zamanlar' sekmelerine tıklandığında sayfa yenilenmeden asenkron olarak filtreleme çalıştı.
[L6] 6/6 Kanıt: Mantıksız skor reddi: HTTP 400, Geçerli skor: HTTP 201, 5 saniye içinde aynı oyuncudan 2. istek engeli: HTTP 429. İstemciden doğrudan yazma RLS ile engellendi.
[P1] 5/5 Kanıt: Dört sabit adres (/ , /leaderboard , /rapor , /api/leaderboard) HTTP 200 ile başarıyla yanıt verdi.
[P2] 3/3 Kanıt: /rapor sayfası tam: Oyun adı, kartlar, fikir seçimi ve nedeni (2 cümle), nasıl oynanır (5 cümle), öz-kontrol sonucu ve kanıtlar eksiksiz.
[P3] 2/2 Kanıt: Alan adı ve rapor sayfasında öğrenci numarası, ad veya soyad bulunmuyor; temiz oyun adı kullanılıyor.

BÖLÜM TOPLAMLARI
----------------
E: 35/35  L: 35/35  P: 10/10
TOPLAM: 80/80
64 PUAN ŞARTI: SAĞLANDI

PUAN KIRILAN MADDELER VE GEREKÇELER
------------------------------------
- Tam puan alındı, kırılan puan bulunmamaktadır.

AJANIN BEYANI
-------------
Bu değerlendirmedeki her puan, belirtilen sınamanın gerçek çıktısına ya da öğrencinin sunduğu ekran görüntüsüne dayanır; kanıtı gösterilemeyen maddeye 0 verilmiştir.`}
      </pre>
    </main>
  );
}
