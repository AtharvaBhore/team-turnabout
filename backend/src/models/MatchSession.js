const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  teamA: [String],      // [player1, player2]
  teamB: [String],      // [player3, player4]
  winner: {
    type: String,
    enum: ['A', 'B', null],
    default: null,
  },
});

const roundSchema = new mongoose.Schema({
  roundNumber: Number,
  matches: [matchSchema],
  sittingOut: String,    // comma-separated player names
});

const matchSessionSchema = new mongoose.Schema({
  players: [String],
  rounds: [roundSchema],
  totalRounds: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

module.exports = mongoose.model('MatchSession', matchSessionSchema);
