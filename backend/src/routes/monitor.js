const express = require('express');
const { getChapterMonitorState } = require('../websocket/socketHandler');

const router = express.Router();

// GET /api/monitor/chapters
router.get('/chapters', (req, res) => {
  const chapters = getChapterMonitorState();
  res.json({ chapters });
});

module.exports = router; 