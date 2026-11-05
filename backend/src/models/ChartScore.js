const mongoose = require('mongoose');

const ChartScoreSchema = new mongoose.Schema({
  trackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true,
    index: true
  },
  
  // Overall scores
  dailyScore: {
    type: Number,
    default: 0,
    index: true
  },
  weeklyScore: {
    type: Number,
    default: 0,
    index: true
  },
  monthlyScore: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Location-based scores
  globalScore: {
    type: Number,
    default: 0
  },
  countryScores: [{
    country: {
      type: String,
      index: true
    },
    score: Number,
    plays: Number,
    uniqueListeners: Number
  }],
  
  // Detailed metrics
  totalPlays: {
    type: Number,
    default: 0
  },
  uniqueListeners: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  reposts: {
    type: Number,
    default: 0
  },
  playlistAdditions: {
    type: Number,
    default: 0
  },
  
  // Growth metrics
  playVelocity: {
    type: Number,
    default: 0  // Plays per day
  },
  growthRate: {
    type: Number,
    default: 0  // Percentage increase
  },
  
  // Ranking information
  globalRank: {
    type: Number,
    default: 0
  },
  countryRanks: [{
    country: String,
    rank: Number
  }],
  genreRank: {
    type: Number,
    default: 0
  },
  
  // Per-window state, so daily/weekly/monthly never overwrite each other:
  // windows.<daily|weekly|monthly> = { rank, previousRank, isNew, hasHistory, periodStartAt,
  //   activeInPeriod, score, metrics: { periodPlays, periodUniqueListeners, periodLikes,
  //   periodShares, totalPlays, likes, shares }, updatedAt }
  windows: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Time tracking
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ChartScoreSchema.index({ trackId: 1, calculatedAt: -1 });
ChartScoreSchema.index({ globalScore: -1 });
ChartScoreSchema.index({ dailyScore: -1 });
ChartScoreSchema.index({ weeklyScore: -1 });
ChartScoreSchema.index({ monthlyScore: -1 });
ChartScoreSchema.index({ 'countryScores.country': 1, 'countryScores.score': -1 });
ChartScoreSchema.index({ genreRank: 1 });

// Compound indexes for optimized country-based queries with time filtering
ChartScoreSchema.index({ lastUpdated: -1, weeklyScore: -1 });
ChartScoreSchema.index({ lastUpdated: -1, dailyScore: -1 });
ChartScoreSchema.index({ lastUpdated: -1, monthlyScore: -1 });
ChartScoreSchema.index({ 'countryScores.country': 1, lastUpdated: -1, weeklyScore: -1 });

module.exports = mongoose.model('ChartScore', ChartScoreSchema);
