const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// ============================================
// RESERVATION ROUTES - /api/reservations
// ============================================

// All routes require authentication
router.use(authenticateToken);

// My reservations
router.get('/my/collector', reservationController.getMyCollectorReservations);
router.get('/my/owner', reservationController.getMyOwnerReservations);

// CRUD operations
router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;
