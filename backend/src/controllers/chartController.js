const ChartScore = require('../models/ChartScore');
const DailyStats = require('../models/DailyStats');
const {
  getCountryCharts: getCountryChartsService,
  getGenreCharts: getGenreChartsService,
  calculateScoresForTimeWindow
} = require('../services/chartService');
const { signTrackUrls } = require('../utils/s3');
const redisCache = require('../utils/redisCache');
const { validateChartFreshness, validateChartsBulk } = require('../utils/chartValidator');

/**
 * Consistent movement fields for every chart entry.
 * previousRank is only ever a stored, real rank from the previous period (never invented).
 */
function movementFields(rank, state) {
  const previousRank = state && state.previousRank ? state.previousRank : null;
  return {
    previousRank,
    rankChange: previousRank ? previousRank - rank : null,
    isNew: !!(state && state.isNew),
    hasHistory: !!(state && state.hasHistory),
    activeInPeriod: state ? !!state.activeInPeriod : true
  };
}

function metricsFromCalc(m = {}) {
  return {
    periodPlays: m.periodPlays || 0,
    periodUniqueListeners: m.periodUniqueListeners || 0,
    periodLikes: m.periodLikes || 0,
    periodShares: m.periodShares || 0,
    totalPlays: m.totalPlays || 0,
    likes: m.likes || 0,
    shares: m.shares || 0
  };
}

/**
 * Get global charts
 * @route GET /api/charts/global
 * @query {string} timeWindow - 'daily', 'weekly', 'monthly' (default: weekly)
 * @query {number} limit - Number of results (default: 50, max: 100)
 */
const getGlobalCharts = async (req, res) => {
  try {
    const timeWindow = req.query.timeWindow || 'weekly';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    // Validate time window
    if (!['daily', 'weekly', 'monthly'].includes(timeWindow)) {
      return res.status(400).json({ message: 'Invalid time window. Must be daily, weekly, or monthly' });
    }
    
    // Try cache first
    const cacheKey = `charts:global:${timeWindow}:${limit}`;
    const cachedData = await redisCache.getCachedCharts('global', { timeWindow, limit });
    
    if (cachedData) {
      // Check cache freshness - invalidate if older than 2 minutes
      const cacheAge = Date.now() - new Date(cachedData.timestamp || cachedData.updatedAt).getTime();
      const maxCacheAge = 2 * 60 * 1000; // 2 minutes
      
      if (cacheAge > maxCacheAge) {
        console.log(`⏰ Global cache expired (${Math.round(cacheAge/1000)}s old), fetching fresh data`);
      } else {
        console.log('📦 Cache hit: Global charts');
        return res.json({
          ...cachedData,
          cached: true,
          timestamp: new Date()
        });
      }
    }
    
    console.log('💾 Cache miss: Fetching from database');
    
    const startTime = Date.now();
    
    // Get chart scores from database
    const sortField = `${timeWindow}Score`;
    const charts = await ChartScore.find()
      .sort({ [sortField]: -1 })
      .limit(limit)
      .populate({
        path: 'trackId',
        select: 'title genre type coverURL audioURL plays likes shares reposts playlistAdditions creatorId',
        populate: {
          path: 'creatorId',
          select: 'name avatar whatsappContact'
        }
      })
      .lean();
    
    const queryTime = Date.now() - startTime;
    
    if (charts.length === 0) {
      // Fallback to calculating on the fly if no cached charts
      const calculatedCharts = await calculateScoresForTimeWindow(timeWindow);
      const signedCharts = await Promise.all(
        calculatedCharts.slice(0, limit).map(async track => {
          const signedTrack = await signTrackUrls(track);
          return {
            ...signedTrack,
            rank: track.rank,
            ...movementFields(track.rank, { activeInPeriod: track.chartMetrics?.activeInPeriod }),
            score: track.chartScore,
            metrics: metricsFromCalc(track.chartMetrics)
          };
        })
      );
      
      const response = {
        charts: signedCharts,
        timeWindow,
        total: signedCharts.length,
        updatedAt: new Date(),
        queryTimeMs: queryTime
      };
      
      // Cache the result
      await redisCache.cacheCharts('global', { timeWindow, limit }, response);
      
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      return res.json(response);
    }
    
    // Format and sign URLs
    const formattedCharts = await Promise.all(
      charts.map(async (chart, index) => {
        const track = chart.trackId;
        if (!track) return null;
        
        const signedTrack = await signTrackUrls(track);
        const state = chart.windows && chart.windows[timeWindow];
        const rank = index + 1;

        return {
          ...signedTrack,
          rank,
          ...movementFields(rank, state),
          score: chart[sortField],
          metrics: state && state.metrics
            ? state.metrics
            : {
                periodPlays: 0,
                periodUniqueListeners: 0,
                periodLikes: 0,
                periodShares: 0,
                totalPlays: track.plays || 0,
                likes: track.likes || 0,
                shares: track.shares || 0
              }
        };
      })
    );
    
    const validCharts = formattedCharts.filter(c => c !== null);
    
    const response = {
      charts: validCharts,
      timeWindow,
      total: validCharts.length,
      updatedAt: charts[0]?.lastUpdated || new Date().toISOString(),
      queryTimeMs: queryTime,
      dataFreshness: {
        lastCalculated: new Date().toISOString(),
        nextUpdateIn: '5 minutes',
        autoRefresh: true
      }
    };
    
    // Cache the result with shorter TTL for fresher data
    await redisCache.cacheCharts('global', { timeWindow, limit }, response);
    
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(response);
  } catch (error) {
    console.error('Error getting global charts:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get country-specific charts
 * @route GET /api/charts/:countryCode
 * @param {string} countryCode - Country code (e.g., 'RW', 'US')
 * @query {string} timeWindow - 'daily', 'weekly', 'monthly'
 * @query {number} limit - Number of results
 */
const getCountryCharts = async (req, res) => {
  try {
    const countryCode = req.params.countryCode.toUpperCase();
    const timeWindow = req.query.timeWindow || 'weekly';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    // Validate country code format
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return res.status(400).json({ message: 'Invalid country code. Use ISO 2-letter code' });
    }
    
    // Try cache first
    const cacheKey = `charts:country:${countryCode}:${timeWindow}:${limit}`;
    console.log(`🔑 Checking cache for key: ${cacheKey}`);
    const cachedData = await redisCache.getCachedCharts('country', { countryCode, timeWindow, limit });
    
    if (cachedData) {
      // Check cache freshness - invalidate if older than 2 minutes
      const cacheAge = Date.now() - new Date(cachedData.timestamp || cachedData.updatedAt).getTime();
      const maxCacheAge = 2 * 60 * 1000; // 2 minutes
      
      if (cacheAge > maxCacheAge) {
        console.log(`⏰ Cache expired for ${countryCode} (${Math.round(cacheAge/1000)}s old), fetching fresh data`);
      } else {
        console.log(`📦 Cache hit: Country charts (${countryCode}) - ${cachedData.charts?.length || 0} tracks`);
        return res.json({
          ...cachedData,
          cached: true,
          timestamp: new Date()
        });
      }
    }
    
    console.log(`💾 Cache miss: Fetching from database for ${countryCode}`);
    
    const startTime = Date.now();
    const charts = await getCountryChartsService(countryCode, timeWindow, limit);
    const queryTime = Date.now() - startTime;
    console.log(`📊 Retrieved ${charts.length} tracks for ${countryCode} from database in ${queryTime}ms`);
    
    if (charts.length === 0) {
      console.warn(`⚠️ No chart data found for country: ${countryCode} in ${timeWindow} period`);
      console.warn(`   This means no tracks have been played from ${countryCode} during this time period`);
    }
    
    // The service now returns complete track data with creator populated
    // Just sign URLs and format
    const formattedCharts = await Promise.all(
      charts.map(async (track, index) => {
        const signedTrack = await signTrackUrls(track);
        return {
          ...signedTrack,
          rank: track.rank || index + 1,
          ...movementFields(track.rank || index + 1, { activeInPeriod: true }),
          country: countryCode,
          countryScore: track.countryScore,
          countryPlays: track.countryPlays,
          countryUniqueListeners: track.countryUniqueListeners,
          // Include metrics showing this is country-specific data
          metrics: {
            periodPlays: track.countryPlays || 0, // plays from this country in the window
            periodUniqueListeners: track.countryUniqueListeners || 0,
            periodLikes: 0,
            periodShares: 0,
            totalPlays: track.globalPlays || track.plays || 0,
            likes: track.likes || 0,
            shares: track.shares || 0
          }
        };
      })
    );
    
    const response = {
      charts: formattedCharts,
      country: countryCode,
      countryName: getCountryName(countryCode),
      timeWindow,
      total: formattedCharts.length,
      updatedAt: new Date().toISOString(),
      queryTimeMs: queryTime,
      dataFreshness: {
        lastCalculated: new Date().toISOString(),
        nextUpdateIn: '5 minutes',
        autoRefresh: true
      }
    };
    
    // Cache the result with shorter TTL for fresher data
    await redisCache.cacheCharts('country', { countryCode, timeWindow, limit }, response);
    
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(response);
  } catch (error) {
    console.error('Error getting country charts:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get genre-specific charts
 * @route GET /api/charts/genre/:genre
 * @param {string} genre - Genre name
 * @query {string} timeWindow - 'daily', 'weekly', 'monthly'
 * @query {number} limit - Number of results
 */
const getGenreCharts = async (req, res) => {
  try {
    const genre = decodeURIComponent(req.params.genre);
    const timeWindow = req.query.timeWindow || 'weekly';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const charts = await getGenreChartsService(genre, timeWindow, limit);
    
    // Sign URLs and format
    const formattedCharts = await Promise.all(
      charts.map(async (track, index) => {
        const signedTrack = await signTrackUrls(track);
        const rank = index + 1;
        return {
          ...signedTrack,
          rank,
          genre: genre,
          genreScore: track.chartScore,
          // genre movement isn't tracked yet: report "no history" rather than guess
          ...movementFields(rank, { activeInPeriod: track.chartMetrics?.activeInPeriod }),
          metrics: metricsFromCalc(track.chartMetrics)
        };
      })
    );
    
    res.json({
      charts: formattedCharts,
      genre,
      timeWindow,
      total: formattedCharts.length,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting genre charts:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get trending tracks (fastest rising)
 * @route GET /api/charts/trending
 * @query {number} limit - Number of results
 */
const getTrendingCharts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const DAY = 864e5;
    const now = Date.now();
    const recentStart = new Date(now - 7 * DAY);
    const priorStart = new Date(now - 14 * DAY);

    // Plays per track: last 7 days vs the 7 days before that
    const rows = await DailyStats.aggregate([
      { $match: { date: { $gte: priorStart } } },
      {
        $group: {
          _id: '$trackId',
          recent: { $sum: { $cond: [{ $gte: ['$date', recentStart] }, '$plays', 0] } },
          prior: { $sum: { $cond: [{ $lt: ['$date', recentStart] }, '$plays', 0] } },
          listeners: { $sum: { $cond: [{ $gte: ['$date', recentStart] }, '$uniqueListeners', 0] } }
        }
      },
      { $match: { recent: { $gt: 0 } } }
    ]);

    // Rising = gained the most plays vs last week; then by this week's plays
    rows.forEach(r => {
      r.gain = r.recent - r.prior;
      r.growth = r.prior > 0 ? Math.round(((r.recent - r.prior) / r.prior) * 100) : null; // null = new this week
    });
    rows.sort((x, y) => y.gain - x.gain || y.recent - x.recent);

    const Track = require('../models/Track');
    const top = rows.slice(0, limit);
    const tracks = await Track.find({ _id: { $in: top.map(r => r._id) }, isPublic: { $ne: false } })
      .select('title genre type coverURL audioURL plays likes shares creatorId createdAt')
      .populate('creatorId', 'name avatar whatsappContact')
      .lean();
    const byId = new Map(tracks.map(t => [String(t._id), t]));

    const formatted = [];
    for (const r of top) {
      const track = byId.get(String(r._id));
      if (!track) continue;
      const signedTrack = await signTrackUrls(track);
      const rank = formatted.length + 1;
      formatted.push({
        ...signedTrack,
        rank,
        ...movementFields(rank, { activeInPeriod: true }),
        isNew: r.prior === 0,
        growthPercent: r.growth,
        trajectory: r.prior === 0 ? 'new' : r.growth >= 50 ? 'rising_fast' : r.growth > 0 ? 'rising' : 'stable',
        metrics: {
          periodPlays: r.recent,
          previousPeriodPlays: r.prior,
          periodUniqueListeners: r.listeners,
          periodLikes: 0,
          periodShares: 0,
          totalPlays: track.plays || 0,
          likes: track.likes || 0,
          shares: track.shares || 0
        }
      });
    }

    res.json({
      charts: formatted,
      type: 'trending',
      timeWindow: 'weekly',
      total: formatted.length,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting trending charts:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get chart metadata and statistics
 * @route GET /api/charts/metadata
 */
const getChartMetadata = async (req, res) => {
  try {
    const totalTracks = await ChartScore.countDocuments();
    const lastUpdate = await ChartScore.findOne().sort({ lastUpdated: -1 }).select('lastUpdated');
    
    const availableCountries = await ChartScore.distinct('countryScores.country');
    const availableGenres = await ChartScore.distinct('genre');
    
    res.json({
      totalTracks,
      lastUpdated: lastUpdate?.lastUpdated || null,
      availableCountries: availableCountries.slice(0, 50),
      availableGenres: availableGenres.slice(0, 20),
      supportedTimeWindows: ['daily', 'weekly', 'monthly']
    });
  } catch (error) {
    console.error('Error getting chart metadata:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Debug endpoint to check chart performance and data freshness
 * @route GET /api/charts/debug
 */
const debugCharts = async (req, res) => {
  try {
    const timeWindow = req.query.timeWindow || 'weekly';
    const countryCode = req.query.country || 'RW';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    
    console.log(`🔍 Debug charts requested for ${countryCode} (${timeWindow})`);
    
    // Get sample charts without caching
    const sortField = `${timeWindow}Score`;
    const sampleCharts = await ChartScore.find()
      .sort({ [sortField]: -1 })
      .limit(limit)
      .select('trackId dailyScore weeklyScore monthlyScore lastUpdated countryScores')
      .lean();
    
    // Validate freshness
    const freshnessValidation = validateChartsBulk(sampleCharts, timeWindow);
    
    // Check cache status
    const cacheKey = `charts:country:${countryCode}:${timeWindow}:${limit}`;
    const cachedData = await redisCache.get(cacheKey);
    
    // Calculate performance metrics
    const avgCountryScores = sampleCharts
      .filter(c => c.countryScores && c.countryScores.length > 0)
      .map(c => {
        const countryData = c.countryScores.find(cs => cs.country === countryCode);
        return countryData ? countryData.score : 0;
      })
      .filter(s => s > 0);
    
    const avgScore = avgCountryScores.length > 0
      ? Math.round(avgCountryScores.reduce((a, b) => a + b, 0) / avgCountryScores.length)
      : 0;
    
    res.json({
      query: { timeWindow, countryCode, limit },
      sampleSize: sampleCharts.length,
      freshness: freshnessValidation,
      cacheStatus: {
        key: cacheKey,
        isCached: !!cachedData,
        cachedAt: cachedData?.timestamp || null,
        ageMinutes: cachedData?.timestamp
          ? Math.round((Date.now() - new Date(cachedData.timestamp).getTime()) / 60000)
          : null
      },
      performance: {
        averageCountryScore: avgScore,
        tracksWithCountryData: avgCountryScores.length,
        indexedFields: ['lastUpdated', sortField, 'countryScores.country']
      },
      recommendations: [
        ...freshnessValidation.recommendations,
        cachedData ? 'Cache is active - check Redis for performance' : 'No cache found - queries hitting database directly',
        avgCountryScores.length < 10 ? `Limited country data for ${countryCode} - may need more listener data` : 'Good country data coverage'
      ],
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error debugging charts:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper function to get country name from code
 */
function getCountryName(code) {
  const countryNames = {
    'RW': 'Rwanda',
    'US': 'United States',
    'GB': 'United Kingdom',
    'KE': 'Kenya',
    'TZ': 'Tanzania',
    'UG': 'Uganda',
    'NG': 'Nigeria',
    'GH': 'Ghana',
    'ZA': 'South Africa',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'IN': 'India',
    'JP': 'Japan',
    'KR': 'South Korea'
  };
  
  return countryNames[code] || code;
}

module.exports = {
  getGlobalCharts,
  getCountryCharts,
  getGenreCharts,
  getTrendingCharts,
  getChartMetadata,
  debugCharts
};
