const express = require('express');
const router = express.Router();
const invitesController = require('../controllers/invitesController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Public endpoint - accept invite
router.post('/accept', invitesController.acceptInvite);

// Protected endpoints - require authentication
router.use(authMiddleware);

// Admin and Super Admin can manage invites
router.post('/', requireRole('admin', 'super_admin'), invitesController.createInvite);
router.post('/bulk', requireRole('admin', 'super_admin'), invitesController.createBulkInvites);
router.get('/', requireRole('admin', 'super_admin'), invitesController.getInvites);
router.get('/stats', requireRole('admin', 'super_admin'), invitesController.getInviteStats);
router.get('/batches', requireRole('admin', 'super_admin'), invitesController.getBatches);
router.post('/:inviteId/resend', requireRole('admin', 'super_admin'), invitesController.resendInvite);
router.delete('/:inviteId', requireRole('admin', 'super_admin'), invitesController.cancelInvite);

// Super admin only - expire old invites (can be called by cron)
router.post('/expire-old', requireRole('super_admin'), invitesController.expireOldInvites);

module.exports = router;
