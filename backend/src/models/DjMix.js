const mongoose = require('mongoose');

/**
 * A recorded DJ set. Private to its owner until published (publishing creates a
 * public Track of type 'mix', which requires a creator account).
 */
const DjMixSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    audioURL: { type: String, required: true },
    audioVariants: {
      low: { type: String, default: '' },
      medium: { type: String, default: '' },
      high: { type: String, default: '' },
      m4a: { type: String, default: '' }
    },
    coverURL: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // seconds
    // tracks heard in the set, with the time (s) each became audible
    tracklist: [
      {
        trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
        title: String,
        artist: String,
        at: Number
      }
    ],
    autoDj: { type: Boolean, default: false },
    publishedTrackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DjMix', DjMixSchema);
