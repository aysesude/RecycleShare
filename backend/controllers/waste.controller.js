const { query } = require('../config/database');

// ============================================
// WASTE CONTROLLER
// ============================================

/**
 * GET /api/waste
 * Tüm aktif atıkları listele (VIEW kullanır)
 * Query params: city, type_id, status
 */
const getAllWaste = async (req, res) => {
  try {
    const { city, type_id, status } = req.query;
    
    // VIEW kullanarak sorgula (Ödev gereksinimi)
    let sql = `SELECT * FROM v_active_waste_details WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (city) {
      sql += ` AND city = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    if (type_id) {
      sql += ` AND type_id = $${paramIndex}`;
      params.push(type_id);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const result = await query(sql, params);

    res.json({
      success: true,
      message: 'Atıklar başarıyla listelendi',
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getAllWaste error:', error);
    res.status(500).json({
      success: false,
      message: 'Atıklar listelenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/waste/search
 * Şehre göre atık ara (FONKSİYON kullanır - Ödev gereksinimi)
 */
const searchWasteByCity = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'Şehir parametresi gerekli'
      });
    }

    // PostgreSQL fonksiyonu kullan (Ödev gereksinimi)
    const result = await query(
      `SELECT * FROM fn_get_waste_by_city($1)`,
      [city]
    );

    res.json({
      success: true,
      message: `${city} şehrindeki atıklar`,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('searchWasteByCity error:', error);
    res.status(500).json({
      success: false,
      message: 'Arama sırasında hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/waste/:id
 * Tek bir atık detayı
 */
const getWasteById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        w.*,
        wt.type_name,
        wt.official_unit,
        wt.recycle_score,
        u.first_name || ' ' || u.last_name AS owner_name,
        u.city,
        u.district,
        u.neighborhood,
        u.phone AS owner_phone
      FROM waste w
      JOIN waste_types wt ON w.type_id = wt.type_id
      JOIN users u ON w.user_id = u.user_id
      WHERE w.waste_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atık bulunamadı'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('getWasteById error:', error);
    res.status(500).json({
      success: false,
      message: 'Atık detayı alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * POST /api/waste
 * Yeni atık ekle (INSERT - Ödev gereksinimi)
 * CHECK constraint test edilebilir: amount > 0 AND amount <= 1000
 */
const createWaste = async (req, res) => {
  try {
    const { type_id, amount, description } = req.body;
    const user_id = req.user.user_id; // Auth middleware'den

    // Validasyon
    if (!type_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'type_id ve amount gerekli'
      });
    }

    // Amount check constraint: 0 < amount <= 1000
    if (amount <= 0 || amount > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Miktar 0-1000 arasında olmalı'
      });
    }

    // Atık türü kontrolü
    const typeCheck = await query(
      'SELECT type_id FROM waste_types WHERE type_id = $1',
      [type_id]
    );

    if (typeCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz atık türü'
      });
    }

    // INSERT işlemi
    const result = await query(`
      INSERT INTO waste (user_id, type_id, amount, description, status)
      VALUES ($1, $2, $3, $4, 'waiting')
      RETURNING *
    `, [user_id, type_id, amount, description || null]);

    // Atık türü bilgisini de ekle
    const wasteWithType = await query(`
      SELECT 
        w.*,
        wt.type_name,
        wt.official_unit,
        wt.recycle_score
      FROM waste w
      JOIN waste_types wt ON w.type_id = wt.type_id
      WHERE w.waste_id = $1
    `, [result.rows[0].waste_id]);

    res.status(201).json({
      success: true,
      message: 'Atık başarıyla eklendi',
      data: wasteWithType.rows[0]
    });

  } catch (error) {
    console.error('createWaste error:', error);
    
    // Check constraint hatası
    if (error.message.includes('violates check constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz değer: Miktar 0-1000 arasında olmalı',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Atık eklenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * PUT /api/waste/:id
 * Atık güncelle (UPDATE - Ödev gereksinimi)
 */
const updateWaste = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_id, amount, description, status } = req.body;
    const user_id = req.user.user_id;

    // Atık sahibi kontrolü
    const wasteCheck = await query(
      'SELECT * FROM waste WHERE waste_id = $1',
      [id]
    );

    if (wasteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atık bulunamadı'
      });
    }

    // Admin değilse sadece kendi atığını güncelleyebilir
    if (wasteCheck.rows[0].user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu atığı güncelleme yetkiniz yok'
      });
    }

    // Dinamik güncelleme sorgusu
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (type_id !== undefined) {
      updates.push(`type_id = $${paramIndex}`);
      values.push(type_id);
      paramIndex++;
    }

    if (amount !== undefined) {
      updates.push(`amount = $${paramIndex}`);
      values.push(amount);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan belirtilmedi'
      });
    }

    values.push(id);
    const sql = `
      UPDATE waste 
      SET ${updates.join(', ')} 
      WHERE waste_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    // Trigger'ın çalışıp çalışmadığını kontrol et
    let triggerMessage = null;
    if (status === 'collected') {
      const triggerLog = await query(`
        SELECT message FROM trigger_logs 
        WHERE table_name = 'waste' 
        AND (new_data->>'waste_id')::int = $1
        ORDER BY created_at DESC LIMIT 1
      `, [id]);
      
      if (triggerLog.rows.length > 0) {
        triggerMessage = triggerLog.rows[0].message;
      }
    }

    res.json({
      success: true,
      message: 'Atık başarıyla güncellendi',
      triggerMessage: triggerMessage,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('updateWaste error:', error);
    
    if (error.message.includes('violates check constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz değer girdiniz',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Atık güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * DELETE /api/waste/:id
 * Atık sil (DELETE - Ödev gereksinimi)
 * CASCADE: İlgili rezervasyonlar da silinir
 */
const deleteWaste = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Atık kontrolü
    const wasteCheck = await query(
      'SELECT * FROM waste WHERE waste_id = $1',
      [id]
    );

    if (wasteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atık bulunamadı'
      });
    }

    // Admin değilse sadece kendi atığını silebilir
    if (wasteCheck.rows[0].user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu atığı silme yetkiniz yok'
      });
    }

    // Attempt deletion inside a transaction: first remove reservations, then delete waste
    try {
      await query('BEGIN');
      await query('DELETE FROM reservations WHERE waste_id = $1', [id]);
      await query('DELETE FROM waste WHERE waste_id = $1', [id]);
      await query('COMMIT');

      res.json({
        success: true,
        message: 'Atık ve ilgili rezervasyonlar başarıyla silindi'
      });
    } catch (txErr) {
      await query('ROLLBACK');
      console.error('deleteWaste transaction error:', txErr);
      return res.status(500).json({ success: false, message: 'Atık silinirken hata oluştu', error: txErr.message });
    }

  } catch (error) {
    console.error('deleteWaste error:', error);
    res.status(500).json({
      success: false,
      message: 'Atık silinirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/waste/my
 * Kullanıcının kendi atıkları
 */
const getMyWaste = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await query(`
      SELECT 
        w.*,
        wt.type_name,
        wt.official_unit,
        wt.recycle_score
      FROM waste w
      JOIN waste_types wt ON w.type_id = wt.type_id
      WHERE w.user_id = $1
      ORDER BY w.record_date DESC
    `, [user_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getMyWaste error:', error);
    res.status(500).json({
      success: false,
      message: 'Atıklar alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/waste/types
 * Atık türlerini listele
 */
const getWasteTypes = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM waste_types ORDER BY type_name
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getWasteTypes error:', error);
    res.status(500).json({
      success: false,
      message: 'Atık türleri alınırken hata oluştu',
      error: error.message
    });
  }
};
const getImpactStats = async (req, res) => {
  try {
    // Guard: ensure auth middleware provided req.user
    if (!req.user || typeof req.user.user_id === 'undefined' || req.user.user_id === null) {
      return res.status(401).json({ success: false, message: "Yetkisiz erişim" });
    }

    const userId = Number(req.user.user_id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Geçersiz kullanıcı ID" });
    }

    // 1) Total items shared by this user (regardless of status)
    const totalResult = await query('SELECT COUNT(*) AS total FROM waste WHERE user_id = $1', [userId]);
    const itemsShared = parseInt(totalResult.rows[0].total, 10) || 0;

    // 2) Monthly breakdown: get counts per month for the last N months
    const MONTHS = 6; // adjust as needed for frontend chart (6 months)
    const monthlyRows = await query(`
      SELECT date_trunc('month', COALESCE(record_date, now())) AS month_start,
             COUNT(*) AS amount
      FROM waste
      WHERE user_id = $1
      GROUP BY month_start
      ORDER BY month_start DESC
      LIMIT 12
    `, [userId]);

    // Map DB rows by year-month key for quick lookup
    const countsByKey = {};
    for (const row of monthlyRows.rows) {
      const dt = new Date(row.month_start);
      if (isNaN(dt)) continue;
      const key = `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`; // month index 0-11
      countsByKey[key] = parseInt(row.amount, 10) || 0;
    }

    // Turkish short month names (match frontend expectation)
    const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

    // Build last MONTHS months array in chronological order
    const monthlyImpact = [];
    const now = new Date();
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      monthlyImpact.push({
        month: monthNames[d.getMonth()],
        amount: countsByKey[key] || 0
      });
    }

    // 3) Derived metrics
    const co2Saved = parseFloat((itemsShared * 2.5).toFixed(1)); // e.g. 2.5 kg per item
    const communityConnections = Math.floor(itemsShared * 0.5);

    // Response format required by frontend
    return res.json({
  itemsShared,
  co2Saved,
  communityConnections,
  monthlyImpact
});
  } catch (error) {
    console.error('getImpactStats error:', error);
    // Avoid leaking internal SQL error details to the client; return safe message
    return res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu'
    });
  }
};
module.exports = {
  getAllWaste,
  searchWasteByCity,
  getWasteById,
  createWaste,
  updateWaste,
  deleteWaste,
  getMyWaste,
  getWasteTypes,
  getImpactStats
};
