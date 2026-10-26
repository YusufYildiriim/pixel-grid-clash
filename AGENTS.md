# Ajan Kuralları (BTÖ-303 Ara Uygulama 3)

- Bu proje çok oyunculu bir oyundur; kullanıcı etkileşimi ve canlı skor tablosu en önemli iki hedeftir.
- Yönergedeki dört sabit adresi mutlaka sun: /, /leaderboard, /rapor ve GET /api/leaderboard (biçim yönergede).
- Next.js (App Router, TypeScript) kullan. Kod yazmadan önce Next.js, Vercel ve kullanılan gerçek zamanlı servisin güncel resmi belgelerini oku.
- Gerçek zamanlı mesaj bütçesine uy: sürekli konum ya da kare yayını yapma; oyuncu başına saniyede en fazla bir güncelleme gönder.
- Skor yazımı yalnızca sunucuda yapılır; girdiyi Zod ve oyun kurallarıyla doğrula; aynı oyuncudan 5 saniye içinde gelen ikinci skoru reddet.
- Servis/rol anahtarını asla NEXT_PUBLIC_ önekiyle tanımlama ve istemci koduna koyma.
- Önce plan çıkar, planı kullanıcıya göster, onay almadan kod yazma. Oyun fikri için en az 3 seçenek sun.
- Her büyük adımdan sonra yönergedeki rubriği (Etkileşim, Skor tablosu, Yayın ve teslim) oku, ilgili maddeleri canlı adreste sına ve eksiklerini kendin bul.
- Sınamayı Playwright ile yap: iki ayrı tarayıcı bağlamı aç; birinde hamle yap, diğerinde sayfa yenilenmeden görünmesini bekle; 375 px genişlikte yatay kaydırmayı kontrol et.
- "Çalışıyor" deme; sınama çıktısını göster. Kanıtsız puan verme; kullanıcı istese bile puan şişirme.
- Sonucu uygulamanın /rapor sayfasına yaz; yaratıcılık maddelerini puanlama.
- .env dosyalarını paylaşma, koda gizli anahtar yazma.
