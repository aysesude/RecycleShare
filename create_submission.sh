#!/bin/bash

# ============================================
# RecycleShare - Ödev Teslim ZIP Oluşturucu
# Grup: 47
# ============================================

echo "🚀 Grup 47 - RecycleShare Teslim ZIP'i Hazırlanıyor..."
echo ""

# Proje dizini
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$PROJECT_DIR"
ZIP_NAME="47.zip"
TEMP_DIR="$PROJECT_DIR/temp_zip_47"

# Önceki temp dizini varsa sil
rm -rf "$TEMP_DIR"
rm -f "$OUTPUT_DIR/$ZIP_NAME"

# Temp dizin oluştur
mkdir -p "$TEMP_DIR/47"

echo "📁 Dosyalar kopyalanıyor..."

# 1. Backend (node_modules HARİÇ, .env DAHİL)
echo "   → Backend..."
mkdir -p "$TEMP_DIR/47/backend"
rsync -av --exclude='node_modules' "$PROJECT_DIR/backend/" "$TEMP_DIR/47/backend/" > /dev/null 2>&1

# 2. Frontend (node_modules HARİÇ, .env DAHİL)
echo "   → Frontend..."
mkdir -p "$TEMP_DIR/47/frontend"
rsync -av --exclude='node_modules' --exclude='dist' "$PROJECT_DIR/frontend/" "$TEMP_DIR/47/frontend/" > /dev/null 2>&1

# 3. Database schema
echo "   → Database schema..."
mkdir -p "$TEMP_DIR/47/database"
cp "$PROJECT_DIR/database/schema.sql" "$TEMP_DIR/47/database/"

# 4. .env.example dosyası (Referans olarak kalsın)
echo "   → .env.example..."
cp "$PROJECT_DIR/backend/.env.example" "$TEMP_DIR/47/" 2>/dev/null || echo "DATABASE_URL=..." > "$TEMP_DIR/47/.env.example"

# 5. README.md
echo "   → README.md..."
cat > "$TEMP_DIR/47/README.md" << 'EOF'
# RecycleShare - Geri Dönüşüm Paylaşım Platformu

## Grup 47 - Veritabanı Lab 2526 Projesi

### 🚀 Hızlı Kurulum ve Çalıştırma

Proje **hazır yapılandırılmış** olarak gelmektedir. `.env` dosyaları dahildir.

#### 1. Gereksinimler
- Node.js 18+
- PostgreSQL (Lokal veya Cloud)

#### 2. Backend Çalıştırma

```bash
cd backend
npm install

# Seçenek A: Lokal Veritabanı (Otomatik oluşturulur)
npm run dev:local

# Seçenek B: Hazır Neon Cloud Veritabanı (.env içindeki ayarlarla)
npm run dev
```

#### 3. Frontend Çalıştırma

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5001

### 🌐 Canlı Demo
- **Frontend:** https://recycle-share.vercel.app
- **Backend:** https://recycleshare.onrender.com

### 📊 Veritabanı Bilgileri
- Platform: Neon Cloud / Local PostgreSQL
- Schema: database/schema.sql
- Tabloları `npm run dev:local` komutu otomatik oluşturur.

### 📋 Ödev Notları
- Tüm gereksinimler (Trigger, Constraint, View, vb.) `schema.sql` içindedir.
- Detaylı proje raporu `rapor.pdf` dosyasındadır.
EOF

# 6. Rapor (eğer varsa)
if [ -f "$PROJECT_DIR/rapor.pdf" ]; then
    echo "   → Rapor PDF..."
    cp "$PROJECT_DIR/rapor.pdf" "$TEMP_DIR/47/"
elif [ -f "$PROJECT_DIR/rapor.pdf" ]; then
    cp "$PROJECT_DIR/rapor.pdf" "$TEMP_DIR/47/"
else
    echo "   ⚠️  rapor.pdf bulunamadı! Daha sonra ekleyin."
fi

# 7. ZIP oluştur
echo ""
echo "📦 ZIP oluşturuluyor..."
cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/$ZIP_NAME" 47 > /dev/null 2>&1

# Temp dizini temizle
rm -rf "$TEMP_DIR"

# Sonuç
echo ""
echo "✅ Teslim dosyası hazır!"
echo ""
echo "📍 Dosya: $OUTPUT_DIR/$ZIP_NAME"
echo ""

# ZIP içeriğini göster
echo "📋 ZIP İçeriği:"
unzip -l "$OUTPUT_DIR/$ZIP_NAME" | head -30

echo ""
echo "📊 Dosya Boyutu: $(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)"
echo ""

# Eksik kontrolü
echo "⚠️  Kontrol Listesi:"
if [ -f "$PROJECT_DIR/rapor.pdf" ]; then
    echo "   ✅ rapor.pdf mevcut"
else
    echo "   ❌ rapor.pdf EKSİK - ZIP'e eklenmedi!"
fi

echo ""
echo "🎉 Tamamlandı! 47.zip dosyasını gönderebilirsiniz."
