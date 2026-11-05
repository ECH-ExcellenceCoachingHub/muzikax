import { getUserFriendlyError } from '../utils/errorMessages';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get auth header
const getAuthHeader = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function for fetch requests
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  const authHeader = getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader,
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export interface ChartTrack {
  _id: string;
  title: string;
  artist: string;
  creatorId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  coverURL: string;
  audioURL: string;
  genre: string;
  type: 'song' | 'beat' | 'mix';
  plays: number;
  likes: number;
  shares: number;
  reposts: number;
  playlistAdditions: number;
  rank: number;
  /** Real rank in the previous period; null when there is no history yet. */
  previousRank: number | null;
  /** previousRank - rank (positive = moved up); null when unknown. */
  rankChange: number | null;
  /** Entered the chart this period (only set once history exists). */
  isNew?: boolean;
  /** False for tracks with no plays inside the selected window (ranked by all-time popularity). */
  activeInPeriod?: boolean;
  score?: number;
  growthPercent?: number | null;
  metrics?: {
    periodPlays: number;
    previousPeriodPlays?: number;
    periodUniqueListeners: number;
    periodLikes: number;
    periodShares: number;
    totalPlays: number;
    likes: number;
    shares: number;
  };
}

export interface ChartsResponse {
  charts: ChartTrack[];
  timeWindow: 'daily' | 'weekly' | 'monthly';
  country?: string;
  countryName?: string;
  genre?: string;
  total: number;
  updatedAt: string;
  queryTimeMs?: number;
  cached?: boolean;
  dataFreshness?: {
    lastCalculated: string;
    nextUpdateIn: string;
    autoRefresh: boolean;
  };
}

export interface TrendingTrack extends ChartTrack {
  trendScore: number;
  velocity: number;
  daysOld: number;
  trajectory: 'rising_fast' | 'rising' | 'stable';
}

export type TimeWindow = 'daily' | 'weekly' | 'monthly';

/**
 * Get global charts
 */
export const getGlobalCharts = async (
  timeWindow: TimeWindow = 'weekly',
  limit: number = 50
): Promise<ChartsResponse> => {
  try {
    const params = new URLSearchParams({ timeWindow, limit: limit.toString() });
    return await fetchAPI(`/api/charts/global?${params}`);
  } catch (error) {
    console.error('Error fetching global charts:', error);
    throw error;
  }
};

/**
 * Get country-specific charts
 */
export const getCountryCharts = async (
  countryCode: string,
  timeWindow: TimeWindow = 'weekly',
  limit: number = 50
): Promise<ChartsResponse> => {
  try {
    const params = new URLSearchParams({ timeWindow, limit: limit.toString() });
    return await fetchAPI(`/api/charts/${countryCode}?${params}`);
  } catch (error) {
    console.error('Error fetching country charts:', error);
    throw error;
  }
};

/**
 * Get genre-specific charts
 */
export const getGenreCharts = async (
  genre: string,
  timeWindow: TimeWindow = 'weekly',
  limit: number = 50
): Promise<ChartsResponse> => {
  try {
    const params = new URLSearchParams({ timeWindow, limit: limit.toString() });
    return await fetchAPI(`/api/charts/genre/${encodeURIComponent(genre)}?${params}`);
  } catch (error) {
    console.error('Error fetching genre charts:', error);
    throw error;
  }
};

/**
 * Get trending tracks (fastest rising)
 */
export const getTrendingTracks = async (
  limit: number = 20
): Promise<{ charts: TrendingTrack[]; type: string; total: number }> => {
  try {
    return await fetchAPI(`/api/charts/trending?limit=${limit}`);
  } catch (error) {
    console.error('Error fetching trending tracks:', error);
    throw error;
  }
};

/**
 * Get chart metadata
 */
export const getChartMetadata = async (): Promise<{
  totalTracks: number;
  lastUpdated: string | null;
  availableCountries: string[];
  availableGenres: string[];
  supportedTimeWindows: TimeWindow[];
}> => {
  try {
    return await fetchAPI('/api/charts/metadata');
  } catch (error) {
    console.error('Error fetching chart metadata:', error);
    throw error;
  }
};

/**
 * Track share event
 */
export const trackShare = async (
  trackId: string,
  platform: string
): Promise<{ success: boolean; totalShares: number }> => {
  try {
    return await fetchAPI('/api/charts/share', {
      method: 'POST',
      body: JSON.stringify({ trackId, platform })
    });
  } catch (error) {
    console.error('Error tracking share:', error);
    throw error;
  }
};

/**
 * Track repost event
 */
export const trackRepost = async (
  trackId: string
): Promise<{ success: boolean; totalReposts: number }> => {
  try {
    return await fetchAPI('/api/charts/repost', {
      method: 'POST',
      body: JSON.stringify({ trackId })
    });
  } catch (error) {
    console.error('Error tracking repost:', error);
    throw error;
  }
};

/**
 * Track playlist addition
 */
export const trackPlaylistAdd = async (
  trackId: string,
  playlistId: string
): Promise<{ success: boolean; totalPlaylistAdditions: number }> => {
  try {
    return await fetchAPI('/api/charts/playlist', {
      method: 'POST',
      body: JSON.stringify({ trackId, playlistId })
    });
  } catch (error) {
    console.error('Error tracking playlist addition:', error);
    throw error;
  }
};
