const express = require('express');
const router = express.Router();
const MatchSession = require('../models/MatchSession');

// GET /api/sessions — list all sessions (newest first)
router.get('/', async (req, res) => {
  try {
    const sessions = await MatchSession.find()
      .sort({ createdAt: -1 })
      .select('players totalRounds status createdAt completedAt');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id — get full session detail
router.get('/:id', async (req, res) => {
  try {
    const session = await MatchSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions — create a new match session
router.post('/', async (req, res) => {
  try {
    const { players, rounds, totalRounds } = req.body;
    if (!players || !rounds) {
      return res.status(400).json({ error: 'players and rounds are required' });
    }
    const session = await MatchSession.create({ players, rounds, totalRounds });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/result — set winner for a specific round match
// Body: { roundNumber: 1, matchIndex: 0, winner: "A" | "B" }
router.post('/:id/result', async (req, res) => {
  try {
    const { roundNumber, matchIndex = 0, winner } = req.body;
    if (!roundNumber || !['A', 'B'].includes(winner)) {
      return res.status(400).json({ error: 'roundNumber and winner (A or B) required' });
    }

    const session = await MatchSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const round = session.rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) return res.status(404).json({ error: 'Round not found' });

    if (!round.matches[matchIndex]) {
      return res.status(404).json({ error: 'Match not found' });
    }

    round.matches[matchIndex].winner = winner;

    // Check if all rounds have results → mark completed
    const allDone = session.rounds.every((r) =>
      r.matches.every((m) => m.winner !== null)
    );
    if (allDone) {
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
