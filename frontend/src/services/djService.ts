import { io, type Socket } from 'socket.io-client';
import { proxyUpload } from './s3Service';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = token();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).message || `Request failed (${res.status})`);
  return data as T;
}

/* ───────────── mixes ───────────── */

export interface DjMix {
  _id: string;
  title: string;
  audioURL: string;
  duration: number;
  coverURL?: string;
  tracklist: { trackId?: string; title: string; artist: string; at: number }[];
  autoDj?: boolean;
  publishedTrackId?: string | null;
  createdAt: string;
}

export async function uploadMix(
  blob: Blob,
  meta: { title: string; duration: number; tracklist: DjMix['tracklist']; autoDj: boolean },
  onProgress?: (pct: number) => void
): Promise<DjMix> {
  const t = token();
  if (!t) throw new Error('Log in to save mixes.');
  const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
  const safe = meta.title.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'mix';
  const file = new File([blob], `dj-mix-${safe}.${ext}`, { type: blob.type || 'audio/webm' });
  const uploaded: any = await proxyUpload(file, t, onProgress);
  return api<DjMix>('/api/dj/mixes', {
    method: 'POST',
    body: JSON.stringify({
      ...meta,
      audioURL: uploaded.fileUrl,
      audioVariants: uploaded.audioVariants || uploaded.variants || {},
    }),
  });
}

export const getMyMixes = () => api<{ mixes: DjMix[] }>('/api/dj/mixes').then((r) => r.mixes);
export const renameMix = (id: string, title: string) => api<DjMix>(`/api/dj/mixes/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) });
export const deleteMix = (id: string) => api<{ ok: boolean }>(`/api/dj/mixes/${id}`, { method: 'DELETE' });
export const publishMix = (id: string) => api<{ ok: boolean; trackId: string }>(`/api/dj/mixes/${id}/publish`, { method: 'POST', body: '{}' });

/* ───────────── live ───────────── */

export interface LiveSet {
  id: string;
  title: string;
  host: { id: string; name: string; avatar: string };
  startedAt: string;
  nowPlaying: { title: string; artist: string; cover?: string } | null;
  listeners: number;
  peakListeners: number;
  live: boolean;
}

export interface LiveChat {
  id: string;
  user: { id: string; name: string; avatar: string };
  isHost: boolean;
  text: string;
  at: string;
}

export const listLiveSets = () => api<{ sets: LiveSet[] }>('/api/dj/live').then((r) => r.sets);
export const getLiveSet = (id: string) => api<LiveSet>(`/api/dj/live/${id}`);
export const liveStreamUrl = (id: string) => `${API}/api/dj/live/${id}/stream`;

let socket: Socket | null = null;
export function liveSocket(): Socket {
  if (!socket) socket = io(API, { transports: ['websocket', 'polling'], reconnection: true });
  return socket;
}

function emitAck<T>(event: string, payload: any, timeout = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const s = liveSocket();
    const timer = setTimeout(() => reject(new Error('The server did not respond.')), timeout);
    s.emit(event, payload, (res: T) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

export const startLive = (title: string) =>
  emitAck<{ ok: boolean; id?: string; message?: string }>('dj:start', { token: token(), title });
export const resumeLive = (id: string) => emitAck<{ ok: boolean }>('dj:resume', { token: token(), id });
export const stopLive = () => liveSocket().emit('dj:stop');
export const sendLiveChunk = (buf: ArrayBuffer) => liveSocket().emit('dj:chunk', buf);
export const sendNowPlaying = (np: { title: string; artist: string; cover?: string } | null) =>
  liveSocket().emit('dj:meta', { nowPlaying: np });

export const joinLive = (id: string) => emitAck<{ ok: boolean; state?: LiveSet; chat?: LiveChat[] }>('live:join', { id });
export const leaveLive = (id: string) => liveSocket().emit('live:leave', { id });
export const sendChat = (id: string, text: string) =>
  emitAck<{ ok: boolean; message?: string }>('live:chat', { id, text, token: token() });
export const sendReaction = (id: string, kind: string) => liveSocket().emit('live:react', { id, kind });
