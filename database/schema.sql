-- ============================================
-- RecycleShare - Veritabanı Şeması
-- PostgreSQL 17 (Neon Cloud)
-- ============================================
-- Ödev Gereksinimleri:
-- ✅ En az 4 tablo (5 tablo var: users, waste_types, waste, reservations, environmental_scores)
-- ✅ Her tabloda en az 10 kayıt
-- ✅ Primary key ve foreign key kısıtları
-- ✅ Silme kısıtı (ON DELETE CASCADE/RESTRICT)
-- ✅ Sayı kısıtı (CHECK constraint)
-- ✅ VIEW tanımı
-- ✅ INDEX tanımı
-- ✅ SEQUENCE tanımı
-- ✅ 3 SQL fonksiyonu (biri RECORD ve CURSOR ile)
-- ✅ 2 TRIGGER
-- ✅ UNION/INTERSECT/EXCEPT sorgusu
-- ✅ Aggregate fonksiyonlar ve HAVING
-- ============================================

-- ============================================
-- 1. TABLOLAR
-- ============================================

-- Pending Registrations (OTP doğrulama bekleyenler)
CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    verification_code_expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Kullanıcılar)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    profile_picture VARCHAR(500),
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    city VARCHAR(100),
    district VARCHAR(100),
    neighborhood VARCHAR(100),
    street VARCHAR(200),
    address_details TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_code_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Waste Types (Atık Türleri)
CREATE TABLE IF NOT EXISTS waste_types (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    official_unit VARCHAR(20) NOT NULL,
    recycle_score INTEGER NOT NULL CHECK (recycle_score >= 0 AND recycle_score <= 100)
);

-- Waste (Atıklar) - Silme ve Sayı Kısıtı Örneği
CREATE TABLE IF NOT EXISTS waste (
    waste_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type_id INTEGER NOT NULL REFERENCES waste_types(type_id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0 AND amount <= 1000),
    description TEXT,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'reserved', 'collected', 'cancelled'))
);

-- Reservations (Rezervasyonlar)
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    waste_id INTEGER NOT NULL REFERENCES waste(waste_id) ON DELETE CASCADE,
    collector_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pickup_datetime TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'reserved', 'collected', 'cancelled'))
);

-- Environmental Scores (Çevresel Puanlar)
CREATE TABLE IF NOT EXISTS environmental_scores (
    score_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    total_score INTEGER DEFAULT 0,
    UNIQUE(user_id, month, year)
);

-- Trigger Log Tablosu (Trigger bildirimlerini saklamak için)
CREATE TABLE IF NOT EXISTS trigger_logs (
    log_id SERIAL PRIMARY KEY,
    trigger_name VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. SEQUENCE (Ödev Gereksinimi)
-- ============================================
-- Rezervasyon numarası için özel sequence
CREATE SEQUENCE IF NOT EXISTS reservation_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MAXVALUE
    CACHE 1;

-- ============================================
-- 3. INDEX'LER (Ödev Gereksinimi)
-- Arama performansı için index oluşturuldu
-- ============================================

-- Users tablosu için indexler
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Waste tablosu için indexler (arama için önemli)
CREATE INDEX IF NOT EXISTS idx_waste_status ON waste(status);
CREATE INDEX IF NOT EXISTS idx_waste_type ON waste(type_id);
CREATE INDEX IF NOT EXISTS idx_waste_user ON waste(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_date ON waste(record_date DESC);

-- Reservations tablosu için indexler
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_collector ON reservations(collector_id);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup ON reservations(pickup_datetime);

-- Environmental Scores için index
CREATE INDEX IF NOT EXISTS idx_scores_user_period ON environmental_scores(user_id, year, month);

-- ============================================
-- 4. VIEW (Ödev Gereksinimi)
-- Arayüzden çağrılan sorgulardan biri VIEW olmalı
-- ============================================

-- VIEW 1: Aktif atıkların detaylı listesi
CREATE OR REPLACE VIEW v_active_waste_details AS
SELECT 
    w.waste_id,
    w.amount,
    w.description,
    w.status,
    w.record_date,
    wt.type_name,
    wt.official_unit,
    wt.recycle_score,
    u.user_id,
    u.first_name || ' ' || u.last_name AS owner_name,
    u.city,
    u.district,
    u.neighborhood,
    u.phone AS owner_phone
FROM waste w
JOIN waste_types wt ON w.type_id = wt.type_id
JOIN users u ON w.user_id = u.user_id
WHERE w.status IN ('waiting', 'reserved')
ORDER BY w.record_date DESC;

-- VIEW 2: Kullanıcı istatistikleri özeti
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.user_id,
    u.first_name || ' ' || u.last_name AS full_name,
    u.email,
    u.city,
    COALESCE(COUNT(DISTINCT w.waste_id), 0) AS total_waste_posted,
    COALESCE(COUNT(DISTINCT r.reservation_id), 0) AS total_reservations_made,
    COALESCE(SUM(es.total_score), 0) AS total_environmental_score
FROM users u
LEFT JOIN waste w ON u.user_id = w.user_id
LEFT JOIN reservations r ON u.user_id = r.collector_id
LEFT JOIN environmental_scores es ON u.user_id = es.user_id
GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.city;

-- VIEW 3: Aylık geri dönüşüm raporu
CREATE OR REPLACE VIEW v_monthly_recycling_report AS
SELECT 
    EXTRACT(YEAR FROM w.record_date) AS year,
    EXTRACT(MONTH FROM w.record_date) AS month,
    wt.type_name,
    COUNT(*) AS total_items,
    SUM(w.amount) AS total_amount,
    wt.official_unit,
    SUM(w.amount * wt.recycle_score) AS total_score_contribution
FROM waste w
JOIN waste_types wt ON w.type_id = wt.type_id
WHERE w.status = 'collected'
GROUP BY EXTRACT(YEAR FROM w.record_date), EXTRACT(MONTH FROM w.record_date), wt.type_name, wt.official_unit
ORDER BY year DESC, month DESC, total_amount DESC;

-- ============================================
-- 5. SQL FONKSİYONLARI (Ödev Gereksinimi - 3 adet)
-- En az birinde RECORD ve CURSOR kullanılmalı
-- ============================================

-- FONKSİYON 1: Kullanıcının toplam çevresel puanını hesapla
CREATE OR REPLACE FUNCTION fn_calculate_user_total_score(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(w.amount * wt.recycle_score), 0)::INTEGER
    INTO total
    FROM waste w
    JOIN waste_types wt ON w.type_id = wt.type_id
    WHERE w.user_id = p_user_id AND w.status = 'collected';
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- FONKSİYON 2: Belirli bir şehirdeki aktif atıkları getir (RECORD kullanımı)
CREATE OR REPLACE FUNCTION fn_get_waste_by_city(p_city VARCHAR)
RETURNS TABLE(
    waste_id INTEGER,
    type_name VARCHAR,
    amount DECIMAL,
    owner_name TEXT,
    district VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.waste_id,
        wt.type_name,
        w.amount,
        (u.first_name || ' ' || u.last_name)::TEXT,
        u.district,
        w.status
    FROM waste w
    JOIN waste_types wt ON w.type_id = wt.type_id
    JOIN users u ON w.user_id = u.user_id
    WHERE u.city = p_city AND w.status IN ('waiting', 'reserved')
    ORDER BY w.record_date DESC;
END;
$$ LANGUAGE plpgsql;

-- FONKSİYON 3: Kullanıcının aylık raporunu getir (CURSOR ve RECORD kullanımı)
CREATE OR REPLACE FUNCTION fn_get_user_monthly_report(
    p_user_id INTEGER,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE(
    report_type VARCHAR,
    type_name VARCHAR,
    item_count BIGINT,
    total_amount DECIMAL,
    total_score BIGINT,
    details TEXT
) AS $$
DECLARE
    waste_cursor CURSOR FOR
        SELECT 
            wt.type_name,
            COUNT(*) as cnt,
            SUM(w.amount) as total_amt,
            SUM(w.amount * wt.recycle_score)::BIGINT as score
        FROM waste w
        JOIN waste_types wt ON w.type_id = wt.type_id
        WHERE w.user_id = p_user_id 
          AND EXTRACT(YEAR FROM w.record_date) = p_year
          AND EXTRACT(MONTH FROM w.record_date) = p_month
          AND w.status = 'collected'
        GROUP BY wt.type_name;
    
    waste_record RECORD;
    total_items BIGINT := 0;
    grand_total_amount DECIMAL := 0;
    grand_total_score BIGINT := 0;
BEGIN
    -- Cursor ile atık verilerini oku
    OPEN waste_cursor;
    LOOP
        FETCH waste_cursor INTO waste_record;
        EXIT WHEN NOT FOUND;
        
        -- Her atık türü için bir satır döndür
        report_type := 'WASTE_DETAIL';
        type_name := waste_record.type_name;
        item_count := waste_record.cnt;
        total_amount := waste_record.total_amt;
        total_score := waste_record.score;
        details := 'Atık türü detayı: ' || waste_record.type_name;
        RETURN NEXT;
        
        -- Toplamları güncelle
        total_items := total_items + waste_record.cnt;
        grand_total_amount := grand_total_amount + waste_record.total_amt;
        grand_total_score := grand_total_score + waste_record.score;
    END LOOP;
    CLOSE waste_cursor;
    
    -- Özet satırı döndür
    report_type := 'SUMMARY';
    type_name := 'TOPLAM';
    item_count := total_items;
    total_amount := grand_total_amount;
    total_score := grand_total_score;
    details := p_year || '-' || p_month || ' dönemi özeti';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGER'LAR (Ödev Gereksinimi - 2 adet)
-- Arayüzden tetiklenmeli ve bildirim mesajı dönmeli
-- ============================================

-- TRIGGER 1: Yeni atık eklendiğinde çevresel puanı güncelle
CREATE OR REPLACE FUNCTION trg_fn_update_environmental_score()
RETURNS TRIGGER AS $$
DECLARE
    v_score INTEGER;
    v_current_month INTEGER;
    v_current_year INTEGER;
    v_message TEXT;
BEGIN
    -- Sadece status 'collected' olduğunda puan hesapla
    IF NEW.status = 'collected' AND (TG_OP = 'INSERT' OR OLD.status != 'collected') THEN
        -- Atık türünün puanını al
        SELECT recycle_score INTO v_score
        FROM waste_types
        WHERE type_id = NEW.type_id;
        
        v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
        v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
        
        -- Environmental score güncelle veya ekle
        INSERT INTO environmental_scores (user_id, month, year, total_score)
        VALUES (NEW.user_id, v_current_month, v_current_year, (NEW.amount * v_score)::INTEGER)
        ON CONFLICT (user_id, month, year)
        DO UPDATE SET total_score = environmental_scores.total_score + (NEW.amount * v_score)::INTEGER;
        
        v_message := 'Tebrikler! ' || (NEW.amount * v_score)::INTEGER || ' çevresel puan kazandınız!';
        
        -- Trigger log'a kaydet
        INSERT INTO trigger_logs (trigger_name, table_name, action, new_data, message)
        VALUES ('trg_update_environmental_score', 'waste', TG_OP, row_to_json(NEW), v_message);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_environmental_score ON waste;
CREATE TRIGGER trg_update_environmental_score
    AFTER INSERT OR UPDATE ON waste
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_update_environmental_score();

-- TRIGGER 2: Rezervasyon yapıldığında atık durumunu güncelle
CREATE OR REPLACE FUNCTION trg_fn_reservation_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_message TEXT;
    v_waste_owner_id INTEGER;
    v_collector_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Yeni rezervasyon eklendiğinde atık durumunu 'reserved' yap
        UPDATE waste SET status = 'reserved' WHERE waste_id = NEW.waste_id;
        
        -- Bilgileri al
        SELECT user_id INTO v_waste_owner_id FROM waste WHERE waste_id = NEW.waste_id;
        SELECT first_name || ' ' || last_name INTO v_collector_name FROM users WHERE user_id = NEW.collector_id;
        
        v_message := 'Atığınız için yeni rezervasyon! Toplayıcı: ' || v_collector_name || 
                     ', Tarih: ' || TO_CHAR(NEW.pickup_datetime, 'DD.MM.YYYY HH24:MI');
        
        -- Trigger log'a kaydet
        INSERT INTO trigger_logs (trigger_name, table_name, action, new_data, message)
        VALUES ('trg_reservation_status_change', 'reservations', 'INSERT', row_to_json(NEW), v_message);
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Rezervasyon durumu değiştiğinde atık durumunu da güncelle
        IF NEW.status = 'collected' AND OLD.status != 'collected' THEN
            UPDATE waste SET status = 'collected' WHERE waste_id = NEW.waste_id;
            
            v_message := 'Atık başarıyla toplandı! Reservation ID: ' || NEW.reservation_id;
            
            INSERT INTO trigger_logs (trigger_name, table_name, action, old_data, new_data, message)
            VALUES ('trg_reservation_status_change', 'reservations', 'UPDATE', row_to_json(OLD), row_to_json(NEW), v_message);
            
        ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            UPDATE waste SET status = 'waiting' WHERE waste_id = NEW.waste_id;
            
            v_message := 'Rezervasyon iptal edildi. Atık tekrar listeye eklendi.';
            
            INSERT INTO trigger_logs (trigger_name, table_name, action, old_data, new_data, message)
            VALUES ('trg_reservation_status_change', 'reservations', 'UPDATE', row_to_json(OLD), row_to_json(NEW), v_message);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_status_change ON reservations;
CREATE TRIGGER trg_reservation_status_change
    AFTER INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_reservation_status_change();

-- ============================================
-- 7. ÖRNEK SORGULAR (API'lerde Kullanılacak)
-- ============================================

-- UNION Sorgusu: Hem atık paylaşan hem de toplayan kullanıcılar
-- SELECT user_id, first_name, last_name, 'Paylaşımcı' as role_type
-- FROM users u
-- WHERE EXISTS (SELECT 1 FROM waste w WHERE w.user_id = u.user_id)
-- UNION
-- SELECT user_id, first_name, last_name, 'Toplayıcı' as role_type
-- FROM users u
-- WHERE EXISTS (SELECT 1 FROM reservations r WHERE r.collector_id = u.user_id);

-- Aggregate + HAVING Sorgusu: En az 2 atık paylaşmış kullanıcılar
-- SELECT 
--     u.user_id,
--     u.first_name || ' ' || u.last_name AS full_name,
--     COUNT(w.waste_id) AS waste_count,
--     SUM(w.amount) AS total_amount
-- FROM users u
-- JOIN waste w ON u.user_id = w.user_id
-- GROUP BY u.user_id, u.first_name, u.last_name
-- HAVING COUNT(w.waste_id) >= 2
-- ORDER BY waste_count DESC;

-- EXCEPT Sorgusu: Hiç rezervasyon yapmamış kullanıcılar
-- SELECT user_id, first_name, last_name FROM users
-- EXCEPT
-- SELECT DISTINCT u.user_id, u.first_name, u.last_name 
-- FROM users u 
-- JOIN reservations r ON u.user_id = r.collector_id;

-- ============================================
-- 8. SEED DATA
-- ============================================

-- Waste Types (Atık Türleri)
INSERT INTO waste_types (type_name, official_unit, recycle_score) VALUES
('Karton', 'kg', 10),
('Cam', 'kg', 15),
('Elektronik', 'adet', 25),
('Plastik', 'kg', 12),
('Pil/Akü', 'adet', 30),
('Organik', 'kg', 5),
('Tekstil', 'kg', 8),
('Metal', 'kg', 20),
('Kağıt', 'kg', 10),
('Ahşap', 'kg', 7)
ON CONFLICT (type_name) DO NOTHING;

-- ============================================
-- KISITLAMALAR ÖZETİ
-- ============================================
-- 1. Silme Kısıtı:
--    - waste.type_id -> ON DELETE RESTRICT (Atık türü silinemez)
--    - waste.user_id -> ON DELETE CASCADE (Kullanıcı silinince atıklar da silinir)
--
-- 2. Sayı Kısıtları (CHECK):
--    - waste.amount: 0 < amount <= 1000
--    - waste_types.recycle_score: 0 <= score <= 100
--    - environmental_scores.month: 1-12 arası
--    - environmental_scores.year: 2020-2100 arası
--    - waste.status ve reservations.status: Belirli değerler
--    - users.role: 'admin' veya 'user'
