/**
 * Live DJ set relay.
 *
 *   DJ browser ── MediaRecorder (webm/opus chunks) ──socket.io──► ffmpeg ──► MP3 ──► HTTP listeners
 *
 * Listeners play GET /api/dj/live/:id/stream in a plain <audio> element (Icecast-style
 * progressive MP3): every browser supports it, and MP3 frames resync on their own, so
 * people can join mid-set. Typical delay is 2–4 s.
 *
 * Chat, reactions, "now playing" and listener counts go over socket.io rooms `live:<id>`.
 */
const { spawn } = require('child_process');
const LiveRoom = require('../models/LiveRoom');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const PRIME_BYTES = 192 * 1024; // ~8 s of 192 kbps audio sent to new listeners so playback starts instantly
const HOST_GRACE_MS = 20000; // keep the set alive this long if the DJ's connection drops
const CHAT_HISTORY = 60;
const REACTIONS = new Set(['fire', 'clap', 'heart', 'hands', 'wow']);

/** @type {Map<string, any>} */
const sessions = new Map();
let ioRef = null;

const room = (id) => `live:${id}`;

function publicState(s) {
  return {
    id: s.id,
    title: s.title,
    host: s.host,
    startedAt: s.startedAt,
    nowPlaying: s.nowPlaying,
    listeners: s.listeners.size,
    peakListeners: s.peakListeners,
    live: !s.ended
  };
}

let countTimer = new Map();
function broadcastCount(s) {
  if (!ioRef || countTimer.has(s.id)) return;
  // throttle: at most one count update per second per room
  countTimer.set(
    s.id,
    setTimeout(() => {
      countTimer.delete(s.id);
      ioRef.to(room(s.id)).emit('live:listeners', { id: s.id, listeners: s.listeners.size });
    }, 1000)
  );
}

function startEncoder(s) {
  const ff = spawn(FFMPEG, [
    '-hide_banner', '-loglevel', 'error',
    '-fflags', '+nobuffer',
    '-f', 'webm', '-i', 'pipe:0',
    '-vn', '-ac', '2', '-ar', '44100',
    '-c:a', 'libmp3lame', '-b:a', '192k',
    '-f', 'mp3', '-flush_packets', '1', 'pipe:1'
  ]);
  ff.stdout.on('data', (chunk) => {
    s.prime.push(chunk);
    s.primeBytes += chunk.length;
    while (s.primeBytes > PRIME_BYTES && s.prime.length > 1) s.primeBytes -= s.prime.shift().length;
    for (const res of s.listeners) {
      if (!res.write(chunk)) {
        // slow client: drop it rather than buffering unbounded memory
        if (res.writableLength > 2 * 1024 * 1024) res.destroy();
      }
    }
  });
  ff.stderr.on('data', (d) => console.warn(`[live ${s.id}] ffmpeg:`, String(d).trim()));
  ff.on('error', (err) => {
    console.error(`[live ${s.id}] ffmpeg failed:`, err.message);
    s.encoderError = err.code === 'ENOENT' ? 'Live streaming is unavailable: ffmpeg is not installed on the server.' : err.message;
    if (s.hostSocket) s.hostSocket.emit('dj:error', { message: s.encoderError });
    endSession(s.id, 'encoder-error');
  });
  ff.on('close', () => {
    if (!s.ended) endSession(s.id, 'encoder-closed');
  });
  ff.stdin.on('error', () => {}); // EPIPE after ffmpeg exits
  return ff;
}

async function endSession(id, reason = 'stopped') {
  const s = sessions.get(id);
  if (!s || s.ended) return;
  s.ended = true;
  clearTimeout(s.graceTimer);
  try {
    s.ff && s.ff.stdin.end();
  } catch (_) {}
  setTimeout(() => {
    try {
      s.ff && s.ff.kill('SIGKILL');
    } catch (_) {}
  }, 3000);
  for (const res of s.listeners) {
    try {
      res.end();
    } catch (_) {}
  }
  s.listeners.clear();
  if (ioRef) ioRef.to(room(id)).emit('live:ended', { id, reason });
  sessions.delete(id);
  try {
    await LiveRoom.findByIdAndUpdate(id, { isLive: false, endTime: new Date(), currentListeners: 0 });
  } catch (e) {
    console.warn('[live] could not mark room ended:', e.message);
  }
  console.log(`🎛️  Live set ${id} ended (${reason})`);
}

async function userFromToken(token) {
  if (!token) return null;
  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.id) return null;
    return await User.findById(decoded.id).select('name avatar role creatorType').lean();
  } catch (_) {
    return null;
  }
}

/* ───────────── HTTP ───────────── */

function listActive() {
  return [...sessions.values()].filter((s) => !s.ended).map(publicState);
}

function getState(id) {
  const s = sessions.get(id);
  return s && !s.ended ? publicState(s) : null;
}

/** Attach an HTTP response as a listener of the MP3 stream. Returns false if the set isn't live. */
function addListener(id, req, res) {
  const s = sessions.get(id);
  if (!s || s.ended) return false;
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'no-cache, no-store',
    Connection: 'keep-alive',
    'X-Content-Type-Options': 'nosniff',
    'icy-name': encodeURIComponent(s.title)
  });
  for (const c of s.prime) res.write(c);
  s.listeners.add(res);
  s.peakListeners = Math.max(s.peakListeners, s.listeners.size);
  broadcastCount(s);
  const drop = () => {
    s.listeners.delete(res);
    broadcastCount(s);
  };
  req.on('close', drop);
  res.on('error', drop);
  return true;
}

/* ───────────── sockets ───────────── */

function registerSocketHandlers(io) {
  ioRef = io;

  io.on('connection', (socket) => {
    const lastChat = { t: 0 };

    // DJ goes live
    socket.on('dj:start', async ({ token, title } = {}, ack = () => {}) => {
      try {
        const user = await userFromToken(token);
        if (!user) return ack({ ok: false, message: 'Please log in to go live.' });
        if (user.role !== 'creator' && user.role !== 'admin') {
          return ack({ ok: false, message: 'Going live is available for creator accounts.' });
        }
        // one live set per host
        for (const s of sessions.values()) if (String(s.host.id) === String(user._id)) await endSession(s.id, 'replaced');

        const cleanTitle = String(title || `${user.name} live`).slice(0, 100);
        const doc = await LiveRoom.create({
          title: cleanTitle,
          description: 'Live DJ set',
          hostId: user._id,
          hostName: user.name,
          hostAvatar: user.avatar || '',
          isLive: true,
          scheduledStartTime: new Date(),
          actualStartTime: new Date(),
          roomType: 'dj_set',
          genre: 'DJ Set'
        });
        const id = String(doc._id);
        const s = {
          id,
          title: cleanTitle,
          host: { id: String(user._id), name: user.name, avatar: user.avatar || '' },
          startedAt: new Date().toISOString(),
          nowPlaying: null,
          listeners: new Set(),
          peakListeners: 0,
          prime: [],
          primeBytes: 0,
          chat: [],
          hostSocket: socket,
          ended: false
        };
        s.ff = startEncoder(s);
        sessions.set(id, s);
        socket.data.liveId = id;
        socket.join(room(id));
        console.log(`🎛️  Live set started: ${id} by ${user.name}`);
        ack({ ok: true, id });
      } catch (e) {
        console.error('[live] start failed:', e);
        ack({ ok: false, message: 'Could not start the live set.' });
      }
    });

    // DJ reconnects after a network blip
    socket.on('dj:resume', async ({ token, id } = {}, ack = () => {}) => {
      const s = sessions.get(id);
      const user = await userFromToken(token);
      if (!s || s.ended || !user || String(user._id) !== s.host.id) return ack({ ok: false });
      clearTimeout(s.graceTimer);
      s.hostSocket = socket;
      socket.data.liveId = id;
      socket.join(room(id));
      ack({ ok: true, id });
    });

    socket.on('dj:chunk', (data) => {
      const s = sessions.get(socket.data.liveId);
      if (!s || s.ended || s.hostSocket !== socket || !data) return;
      try {
        s.ff.stdin.write(Buffer.from(data));
      } catch (_) {}
    });

    socket.on('dj:meta', ({ nowPlaying } = {}) => {
      const s = sessions.get(socket.data.liveId);
      if (!s || s.hostSocket !== socket) return;
      s.nowPlaying = nowPlaying
        ? { title: String(nowPlaying.title || '').slice(0, 140), artist: String(nowPlaying.artist || '').slice(0, 80), cover: String(nowPlaying.cover || '') }
        : null;
      io.to(room(s.id)).emit('live:meta', { id: s.id, nowPlaying: s.nowPlaying });
    });

    socket.on('dj:stop', () => {
      const s = sessions.get(socket.data.liveId);
      if (s && s.hostSocket === socket) endSession(s.id, 'stopped');
      socket.data.liveId = null;
    });

    // Audience
    socket.on('live:join', ({ id } = {}, ack = () => {}) => {
      const s = sessions.get(id);
      if (!s || s.ended) return ack({ ok: false });
      socket.join(room(id));
      ack({ ok: true, state: publicState(s), chat: s.chat });
    });

    socket.on('live:leave', ({ id } = {}) => socket.leave(room(id)));

    socket.on('live:chat', async ({ id, text, token } = {}, ack = () => {}) => {
      const s = sessions.get(id);
      if (!s || s.ended) return ack({ ok: false });
      const now = Date.now();
      if (now - lastChat.t < 800) return ack({ ok: false, message: 'Slow down a little.' });
      const clean = String(text || '').trim().slice(0, 300);
      if (!clean) return ack({ ok: false });
      if (!socket.data.user) socket.data.user = await userFromToken(token);
      const user = socket.data.user;
      if (!user) return ack({ ok: false, message: 'Log in to chat.' });
      lastChat.t = now;
      const msg = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        user: { id: String(user._id), name: user.name, avatar: user.avatar || '' },
        isHost: String(user._id) === s.host.id,
        text: clean,
        at: new Date().toISOString()
      };
      s.chat.push(msg);
      if (s.chat.length > CHAT_HISTORY) s.chat.shift();
      io.to(room(id)).emit('live:chat', msg);
      ack({ ok: true });
    });

    socket.on('live:react', ({ id, kind } = {}) => {
      const s = sessions.get(id);
      if (!s || s.ended || !REACTIONS.has(kind)) return;
      const now = Date.now();
      if (now - (socket.data.lastReact || 0) < 250) return;
      socket.data.lastReact = now;
      io.to(room(id)).emit('live:react', { kind });
    });

    socket.on('disconnect', () => {
      const s = sessions.get(socket.data.liveId);
      if (s && s.hostSocket === socket && !s.ended) {
        s.hostSocket = null;
        io.to(room(s.id)).emit('live:host-reconnecting', { id: s.id });
        s.graceTimer = setTimeout(() => endSession(s.id, 'host-disconnected'), HOST_GRACE_MS);
      }
    });
  });
}

module.exports = { registerSocketHandlers, listActive, getState, addListener, endSession };
