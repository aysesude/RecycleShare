const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// ============================================
// ADMIN ROUTES - /api/admin
// Tüm route'lar admin yetkisi gerektirir
// ============================================

// Middleware: Auth + Admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Waste type management
router.get('/waste-types', adminController.getWasteTypes);
router.post('/waste-types', adminController.createWasteType);
router.put('/waste-types/:id', adminController.updateWasteType);
router.delete('/waste-types/:id', adminController.deleteWasteType);

// Trigger logs
router.get('/trigger-logs', adminController.getTriggerLogs);

module.exports = router;
