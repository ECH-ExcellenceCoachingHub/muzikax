const DjMix = require('../models/DjMix');
const Track = require('../models/Track');
const liveRelay = require('../services/liveRelay');

/* ───────────── Mixes ───────────── */

// POST /api/dj/mixes  — save a recorded set (private)
const createMix = async (req, res) => {
  try {
    const { title, audioURL, audioVariants, duration, tracklist, coverURL, autoDj } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Give your mix a name.' });
    if (!audioURL) return res.status(400).json({ message: 'audioURL is required.' });

    const mix = await DjMix.create({
      userId: req.user._id,
      title: String(title).trim().slice(0, 120),
      audioURL,
      audioVariants: audioVariants || {},
      coverURL: coverURL || '',
      duration: Math.max(0, Math.round(Number(duration) || 0)),
      autoDj: !!autoDj,
      tracklist: Array.isArray(tracklist)
        ? tracklist.slice(0, 200).map((t) => ({
            trackId: /^[a-f0-9]{24}$/i.test(String(t.trackId || '')) ? t.trackId : undefined,
            title: String(t.title || '').slice(0, 160),
            artist: String(t.artist || '').slice(0, 100),
            at: Math.max(0, Number(t.at) || 0)
          }))
        : []
    });
    res.status(201).json(mix);
  } catch (error) {
    console.error('createMix error:', error);
    res.status(500).json({ message: 'Could not save the mix.' });
  }
};

// GET /api/dj/mixes — my mixes
const getMyMixes = async (req, res) => {
  try {
    const mixes = await DjMix.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ mixes });
  } catch (error) {
    res.status(500).json({ message: 'Could not load your mixes.' });
  }
};

// PATCH /api/dj/mixes/:id — rename
const updateMix = async (req, res) => {
  try {
    const mix = await DjMix.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mix) return res.status(404).json({ message: 'Mix not found.' });
    if (req.body.title) mix.title = String(req.body.title).trim().slice(0, 120);
    await mix.save();
    res.json(mix);
  } catch (error) {
    res.status(500).json({ message: 'Could not update the mix.' });
  }
};

// DELETE /api/dj/mixes/:id
const deleteMix = async (req, res) => {
  try {
    const mix = await DjMix.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!mix) return res.status(404).json({ message: 'Mix not found.' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete the mix.' });
  }
};

// POST /api/dj/mixes/:id/publish — make it a public Mix track (creators only)
const publishMix = async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ message: 'Publishing mixes is available for creator accounts.' });
    }
    const mix = await DjMix.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mix) return res.status(404).json({ message: 'Mix not found.' });
    if (mix.publishedTrackId) {
      const existing = await Track.findById(mix.publishedTrackId).lean();
      if (existing) return res.json({ ok: true, trackId: existing._id, alreadyPublished: true });
    }

    const lines = (mix.tracklist || [])
      .map((t) => {
        const m = Math.floor((t.at || 0) / 60);
        const s = String(Math.floor((t.at || 0) % 60)).padStart(2, '0');
        return `${m}:${s}  ${t.artist ? `${t.artist} – ` : ''}${t.title}`;
      })
      .join('\n');

    const track = await Track.create({
      creatorId: req.user._id,
      creatorType: req.user.creatorType || 'dj',
      title: (req.body && req.body.title ? String(req.body.title) : mix.title).slice(0, 120),
      description: lines ? `Tracklist\n${lines}` : 'DJ mix recorded on MuzikaX',
      audioURL: mix.audioURL,
      audioVariants: mix.audioVariants,
      coverURL: (req.body && req.body.coverURL) || mix.coverURL || '',
      genre: (req.body && req.body.genre) || 'Mix',
      type: 'mix',
      paymentType: 'free',
      isPublic: true,
      copyrightAccepted: true
    });
    mix.publishedTrackId = track._id;
    await mix.save();
    res.status(201).json({ ok: true, trackId: track._id });
  } catch (error) {
    console.error('publishMix error:', error);
    res.status(500).json({ message: 'Could not publish the mix.' });
  }
};

/* ───────────── Live ───────────── */

// GET /api/dj/live — sets on air right now
const listLive = (req, res) => res.json({ sets: liveRelay.listActive() });

// GET /api/dj/live/:id
const getLive = (req, res) => {
  const state = liveRelay.getState(req.params.id);
  if (!state) return res.status(404).json({ message: 'This live set has ended.' });
  res.json(state);
};

// GET /api/dj/live/:id/stream — MP3 audio for listeners
const streamLive = (req, res) => {
  if (!liveRelay.addListener(req.params.id, req, res)) {
    res.status(404).json({ message: 'This live set has ended.' });
  }
};

module.exports = { createMix, getMyMixes, updateMix, deleteMix, publishMix, listLive, getLive, streamLive };
