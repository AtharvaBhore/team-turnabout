const express = require('express');
const router = express.Router();
const MatchSession = require('../models/MatchSession');

// GET /api/stats/players — per-player statistics across all sessions
router.get('/players', async (req, res) => {
  try {
    const sessions = await MatchSession.find();
    const stats = {};

    for (const session of sessions) {
      for (const round of session.rounds) {
        for (const match of round.matches) {
          const allPlayers = [...match.teamA, ...match.teamB];
          for (const p of allPlayers) {
            if (!stats[p]) stats[p] = { name: p, wins: 0, losses: 0, played: 0 };
            if (match.winner) {
              stats[p].played++;
              const isTeamA = match.teamA.includes(p);
              if ((match.winner === 'A' && isTeamA) || (match.winner === 'B' && !isTeamA)) {
                stats[p].wins++;
              } else {
                stats[p].losses++;
              }
            }
          }
        }
      }
    }

    const result = Object.values(stats).map((s) => ({
      ...s,
      winPercentage: s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0,
    }));

    res.json(result.sort((a, b) => b.winPercentage - a.winPercentage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/duos — duo (pair) statistics
router.get('/duos', async (req, res) => {
  try {
    const sessions = await MatchSession.find();
    const duos = {};

    for (const session of sessions) {
      for (const round of session.rounds) {
        for (const match of round.matches) {
          if (!match.winner) continue;

          const processPair = (pair, isWinningTeam) => {
            const key = [...pair].sort().join(' & ');
            if (!duos[key]) duos[key] = { duo: key, wins: 0, losses: 0, played: 0 };
            duos[key].played++;
            if (isWinningTeam) duos[key].wins++;
            else duos[key].losses++;
          };

          processPair(match.teamA, match.winner === 'A');
          processPair(match.teamB, match.winner === 'B');
        }
      }
    }

    const result = Object.values(duos).map((d) => ({
      ...d,
      winPercentage: d.played > 0 ? Math.round((d.wins / d.played) * 100) : 0,
    }));

    res.json(result.sort((a, b) => b.winPercentage - a.winPercentage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/players/trend — per-session win rate for charts
router.get('/players/trend', async (req, res) => {
  try {
    const sessions = await MatchSession.find().sort({ createdAt: 1 });
    const playerTrends = {};

    for (const session of sessions) {
      const sessionStats = {};

      for (const round of session.rounds) {
        for (const match of round.matches) {
          if (!match.winner) continue;
          const allPlayers = [...match.teamA, ...match.teamB];
          for (const p of allPlayers) {
            if (!sessionStats[p]) sessionStats[p] = { wins: 0, played: 0 };
            sessionStats[p].played++;
            const isTeamA = match.teamA.includes(p);
            if ((match.winner === 'A' && isTeamA) || (match.winner === 'B' && !isTeamA)) {
              sessionStats[p].wins++;
            }
          }
        }
      }

      for (const [player, s] of Object.entries(sessionStats)) {
        if (!playerTrends[player]) playerTrends[player] = [];
        playerTrends[player].push({
          sessionDate: session.createdAt,
          sessionId: session._id,
          winRate: s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0,
          wins: s.wins,
          played: s.played,
        });
      }
    }

    res.json(playerTrends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
