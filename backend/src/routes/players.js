const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// GET /api/players — list all active players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find({ active: true }).sort({ name: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/players — add a new player
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    const player = await Player.create({ name: name.trim() });
    res.status(201).json(player);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Player already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/players/:id — soft-delete (deactivate)
router.delete('/:id', async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: 'Player deactivated', player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
