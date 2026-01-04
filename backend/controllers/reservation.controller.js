const { query } = require('../config/database');

// ============================================
// RESERVATIONS CONTROLLER
// ============================================

/**
 * GET /api/reservations
 * Tüm rezervasyonları listele
 */
const getAllReservations = async (req, res) => {
  try {
    const { status, waste_id } = req.query;

    let sql = `
      SELECT 
        r.*,
        w.amount,
        w.description AS waste_description,
        wt.type_name,
        wt.official_unit,
        u_owner.first_name || ' ' || u_owner.last_name AS owner_name,
        u_owner.city,
        u_owner.district,
        u_owner.phone AS owner_phone,
        u_collector.first_name || ' ' || u_collector.last_name AS collector_name,
        u_collector.phone AS collector_phone
      FROM reservations r
      JOIN waste w ON r.waste_id = w.waste_id
      JOIN waste_types wt ON w.type_id = wt.type_id
      JOIN users u_owner ON w.user_id = u_owner.user_id
      JOIN users u_collector ON r.collector_id = u_collector.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (waste_id) {
      sql += ` AND r.waste_id = $${paramIndex}`;
      params.push(waste_id);
      paramIndex++;
    }

    sql += ` ORDER BY r.created_at DESC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getAllReservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar listelenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/:id
 * Tek rezervasyon detayı
 */
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        r.*,
        w.amount,
        w.description AS waste_description,
        wt.type_name,
        wt.official_unit,
        u_owner.first_name || ' ' || u_owner.last_name AS owner_name,
        u_owner.city,
        u_owner.district,
        u_owner.neighborhood,
        u_owner.street,
        u_owner.address_details,
        u_owner.phone AS owner_phone,
        u_collector.first_name || ' ' || u_collector.last_name AS collector_name,
        u_collector.phone AS collector_phone
      FROM reservations r
      JOIN waste w ON r.waste_id = w.waste_id
      JOIN waste_types wt ON w.type_id = wt.type_id
      JOIN users u_owner ON w.user_id = u_owner.user_id
      JOIN users u_collector ON r.collector_id = u_collector.user_id
      WHERE r.reservation_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('getReservationById error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon detayı alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations
 * Yeni rezervasyon oluştur (SEQUENCE ve TRIGGER kullanır)
 */
const createReservation = async (req, res) => {
  try {
    const { waste_id, pickup_datetime } = req.body;
    const collector_id = req.user.user_id;

    // Validasyon
    if (!waste_id || !pickup_datetime) {
      return res.status(400).json({
        success: false,
        message: 'waste_id ve pickup_datetime gerekli'
      });
    }

    // Atık kontrolü
    const wasteCheck = await query(
      'SELECT * FROM waste WHERE waste_id = $1',
      [waste_id]
    );

    if (wasteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Atık bulunamadı'
      });
    }

    // Atık durumu kontrolü
    if (wasteCheck.rows[0].status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Bu atık için rezervasyon yapılamaz (durum: ' + wasteCheck.rows[0].status + ')'
      });
    }

    // Kendi atığına rezervasyon yapamaz
    if (wasteCheck.rows[0].user_id === collector_id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi atığınıza rezervasyon yapamazsınız'
      });
    }

    // SEQUENCE kullanarak rezervasyon numarası al (Ödev gereksinimi)
    const seqResult = await query("SELECT nextval('reservation_number_seq') as reservation_number");
    const reservationNumber = seqResult.rows[0].reservation_number;

    // INSERT - TRIGGER otomatik çalışacak ve atık durumunu 'reserved' yapacak
    const result = await query(`
      INSERT INTO reservations (waste_id, collector_id, pickup_datetime, status)
      VALUES ($1, $2, $3, 'waiting')
      RETURNING *
    `, [waste_id, collector_id, pickup_datetime]);

    // Trigger log'dan mesajı al
    const triggerLog = await query(`
      SELECT message FROM trigger_logs 
      WHERE trigger_name = 'trg_reservation_status_change'
      AND table_name = 'reservations'
      ORDER BY created_at DESC LIMIT 1
    `);

    const triggerMessage = triggerLog.rows.length > 0 ? triggerLog.rows[0].message : null;

    res.status(201).json({
      success: true,
      message: 'Rezervasyon başarıyla oluşturuldu',
      reservationNumber: reservationNumber,
      triggerMessage: triggerMessage, // Trigger'ın çalıştığını göster
      data: result.rows[0]
    });

  } catch (error) {
    console.error('createReservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * PUT /api/reservations/:id
 * Rezervasyon durumunu güncelle (TRIGGER çalışır)
 */
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pickup_datetime } = req.body;
    const user_id = req.user.user_id;

    // Rezervasyon kontrolü
    const resCheck = await query(`
      SELECT r.*, w.user_id as owner_id
      FROM reservations r
      JOIN waste w ON r.waste_id = w.waste_id
      WHERE r.reservation_id = $1
    `, [id]);

    if (resCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    const reservation = resCheck.rows[0];

    // Yetki kontrolü: Admin, toplayıcı veya atık sahibi güncelleyebilir
    if (
      req.user.role !== 'admin' && 
      reservation.collector_id !== user_id && 
      reservation.owner_id !== user_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu rezervasyonu güncelleme yetkiniz yok'
      });
    }

    // Dinamik güncelleme
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status !== undefined) {
      // Status değeri kontrolü
      const validStatuses = ['waiting', 'reserved', 'collected', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz durum. Geçerli değerler: ' + validStatuses.join(', ')
        });
      }
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (pickup_datetime !== undefined) {
      updates.push(`pickup_datetime = $${paramIndex}`);
      values.push(pickup_datetime);
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
      UPDATE reservations 
      SET ${updates.join(', ')} 
      WHERE reservation_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    // Trigger log'dan mesajı al
    let triggerMessage = null;
    if (status === 'collected' || status === 'cancelled') {
      const triggerLog = await query(`
        SELECT message FROM trigger_logs 
        WHERE trigger_name = 'trg_reservation_status_change'
        AND table_name = 'reservations'
        ORDER BY created_at DESC LIMIT 1
      `);
      
      if (triggerLog.rows.length > 0) {
        triggerMessage = triggerLog.rows[0].message;
      }
    }

    res.json({
      success: true,
      message: 'Rezervasyon başarıyla güncellendi',
      triggerMessage: triggerMessage,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('updateReservation error:', error);
    
    if (error.message.includes('violates check constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Rezervasyon güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * DELETE /api/reservations/:id
 * Rezervasyon sil
 */
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Rezervasyon kontrolü
    const resCheck = await query(
      'SELECT * FROM reservations WHERE reservation_id = $1',
      [id]
    );

    if (resCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    // Admin değilse sadece kendi rezervasyonunu silebilir
    if (resCheck.rows[0].collector_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu rezervasyonu silme yetkiniz yok'
      });
    }

    // Atık durumunu 'waiting' yap
    await query(
      "UPDATE waste SET status = 'waiting' WHERE waste_id = $1",
      [resCheck.rows[0].waste_id]
    );

    // DELETE işlemi
    await query('DELETE FROM reservations WHERE reservation_id = $1', [id]);

    res.json({
      success: true,
      message: 'Rezervasyon başarıyla silindi ve atık tekrar listeye eklendi'
    });

  } catch (error) {
    console.error('deleteReservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon silinirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/my/collector
 * Kullanıcının toplayıcı olarak yaptığı rezervasyonlar
 */
const getMyCollectorReservations = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await query(`
      SELECT 
        r.*,
        w.amount,
        w.description AS waste_description,
        wt.type_name,
        wt.official_unit,
        u.first_name || ' ' || u.last_name AS owner_name,
        u.city,
        u.district,
        u.phone AS owner_phone
      FROM reservations r
      JOIN waste w ON r.waste_id = w.waste_id
      JOIN waste_types wt ON w.type_id = wt.type_id
      JOIN users u ON w.user_id = u.user_id
      WHERE r.collector_id = $1
      ORDER BY r.created_at DESC
    `, [user_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getMyCollectorReservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/my/owner
 * Kullanıcının atıklarına yapılan rezervasyonlar
 */
const getMyOwnerReservations = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await query(`
      SELECT 
        r.*,
        w.amount,
        w.description AS waste_description,
        wt.type_name,
        wt.official_unit,
        u.first_name || ' ' || u.last_name AS collector_name,
        u.phone AS collector_phone
      FROM reservations r
      JOIN waste w ON r.waste_id = w.waste_id
      JOIN waste_types wt ON w.type_id = wt.type_id
      JOIN users u ON r.collector_id = u.user_id
      WHERE w.user_id = $1
      ORDER BY r.created_at DESC
    `, [user_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getMyOwnerReservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar alınırken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  getMyCollectorReservations,
  getMyOwnerReservations
};
