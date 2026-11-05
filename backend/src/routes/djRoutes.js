const express = require('express');
const { protect } = require('../utils/jwt');
const {
  createMix,
  getMyMixes,
  updateMix,
  deleteMix,
  publishMix,
  listLive,
  getLive,
  streamLive
} = require('../controllers/djController');

const router = express.Router();

// Recorded mixes (private to the owner until published)
router.route('/mixes').get(protect, getMyMixes).post(protect, createMix);
router.route('/mixes/:id').patch(protect, updateMix).delete(protect, deleteMix);
router.post('/mixes/:id/publish', protect, publishMix);

// Live sets (public)
router.get('/live', listLive);
router.get('/live/:id', getLive);
router.get('/live/:id/stream', streamLive);

module.exports = router;
