# ♻️ RecycleShare - Development Roadmap

Bu dosya, projenin tamamlanması için gereken adımları ve yapılacaklar listesini içerir.

## ✅ Phase 1: Altyapı & Kimlik Doğrulama (TAMAMLANDI)
- [x] Proje kurulumu (Vite + React & Node.js + Express)
- [x] PostgreSQL Veritabanı bağlantısı (Neon DB)
- [x] Login & Register Sayfaları (Eco-Minimalist Tasarım)
- [x] Google OAuth Entegrasyonu
- [x] Email ile OTP Doğrulama Sistemi (Nodemailer)
- [x] Kullanıcı Rolleri (Admin / User) ayrımı

---

## 🚧 Phase 2: İlan (Listing) Modülü
Kullanıcılar atık ilanı oluşturabilir ve başkalarının ilanlarını alabilir.

### Backend
- [ ] **POST /api/listings:** Yeni ilan oluşturma endpoint'i.
  - Gerekli alanlar: `title`, `description`, `weight`, `type` (plastik, kağıt, cam, metal, elektronik), `image_url`.
  - Konum verisi: `latitude`, `longitude`, `address`.
- [ ] **Image Upload:** Fotoğraflar için `Multer` veya Cloudinary entegrasyonu.
- [ ] **GET /api/listings:** Tüm aktif ilanları listeleme (Filtreleme destekli).
- [ ] **GET /api/listings/my-listings:** Kullanıcının kendi ilanlarını listelemesi.
- [ ] **GET /api/listings/:id:** Tek ilan detayı.
- [ ] **PUT /api/listings/:id:** İlan güncelleme (sadece ilan sahibi).
- [ ] **DELETE /api/listings/:id:** İlanı silme (ilan sahibi veya admin).

### Frontend
- [ ] **Create Listing Page:**
  - Fotoğraf yükleme alanı (Drag & Drop).
  - Atık türü seçimi (Dropdown).
  - Konum seçimi (Otomatik konum bulma veya haritadan seçme).
- [ ] **My Listings Page:** Kullanıcının kendi ilanlarını yönettiği sayfa.

---

## 🚧 Phase 3: Keşfet & Harita Modülü
Kullanıcıların ilanları keşfedip alacağı kısımdır.

### Backend
- [ ] **GET /api/listings:** Filtreleme (Konuma göre, Türe göre, Tarihe göre).
- [ ] **PUT /api/listings/reserve/:id:** Bir ilanı rezerve etme (Status: `active` -> `reserved`).
- [ ] **PUT /api/listings/cancel-reserve/:id:** Rezervasyonu iptal etme.

### Frontend
- [ ] **Explore Page (Feed):** Tüm ilanların listelendiği ana sayfa (Grid yapısı).
- [ ] **Map View:** İlanların harita üzerinde pin olarak gösterilmesi (Leaflet veya Google Maps).
- [ ] **Filter & Search Bar:** Tür, konum, tarih filtreleri ve arama.
- [ ] **Listing Detail Modal:** İlan detayları ve "Rezerve Et" / "Teslim Al" butonları.

---

## 🚧 Phase 4: Transfer & Puanlama (Gamification)
Atık teslim alındığında puan kazanma sistemi.

### Backend
- [ ] **PUT /api/listings/complete/:id:** Transferin tamamlanması.
  - İlan durumu: `reserved` -> `completed`.
  - **Puan Ekleme:** İlan sahibine +10 puan, Alan kişiye +5 puan.
- [ ] **GET /api/users/leaderboard:** En çok puan kazanan kullanıcılar sıralaması.

### Frontend
- [ ] **QR Code / Onay Sistemi:** (Opsiyonel) Teslimatta onay kodu.
- [ ] **Success Animation:** "Tebrikler +10 Puan Kazandınız" animasyonu.
- [ ] **Leaderboard Page:** Puan sıralaması tablosu.

---

## 🚧 Phase 5: Profil & Admin Panel

### User Profile
- [ ] **Profile Page:**
  - Kullanıcı resmi, Ad Soyad düzenleme.
  - Toplam kazanılan puan gösterimi.
  - "Geri Dönüşüm Seviyesi" rozeti (Örn: Çaylak, Doğa Dostu, Eko-Kahraman).
  - Geçmiş ilanlar ve alınan atıklar listesi.
- [ ] **Settings Page:** Şifre değiştirme, bildirim ayarları.
- [ ] **Logout:** Çıkış yapma fonksiyonu.

### Admin Panel
- [ ] **Admin Dashboard:** Genel istatistikler (Toplam kullanıcı, ilan, transfer).
- [ ] **User Management:** Kullanıcıları listeleme, banlama, rol değiştirme.
- [ ] **Listing Management:** İlanları moderasyon (silme, onaylama).
- [ ] **Reports:** Şikayet edilen içerikleri görüntüleme.

---

## 🛠 Teknik "To-Do" Listesi
- [ ] **Error Handling:** Backend hatalarını frontend'de kullanıcıya şık bir şekilde gösterme (Toast mesajları).
- [ ] **Responsive Test:** Mobilde menülerin ve kartların düzgün göründüğünün kontrolü.
- [ ] **Loading States:** Veri çekilirken dönen yükleniyor (spinner) ikonlarının eklenmesi.
- [ ] **Rate Limiting:** API'ye aşırı istek gönderilmesini engelleme.
- [ ] **Input Sanitization:** XSS ve SQL injection koruması.

---

## 👥 Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| **User** | İlan oluşturma, ilanları görme, rezerve etme, teslim alma, profil düzenleme |
| **Admin** | Tüm user yetkileri + Kullanıcı yönetimi, ilan moderasyonu, istatistik görüntüleme |

---

## 📊 İlerleme Durumu

| Phase | Durum | Tamamlanma |
|-------|-------|------------|
| Phase 1 - Auth | ✅ Tamamlandı | 100% |
| Phase 2 - Listings | 🚧 Bekliyor | 0% |
| Phase 3 - Explore | 🚧 Bekliyor | 0% |
| Phase 4 - Gamification | 🚧 Bekliyor | 0% |
| Phase 5 - Profile & Admin | 🚧 Bekliyor | 0% |

---

## 🔗 Kaynaklar

- **API Docs:** https://recycleshare.onrender.com/api/docs/
- **Database:** Neon PostgreSQL (Frankfurt)
- **Frontend:** React + Vite + Tailwind + DaisyUI

---

*Son güncelleme: Ocak 2026*
