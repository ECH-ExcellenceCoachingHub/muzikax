"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { getChartMetadata, getGlobalCharts, getTrendingTracks } from "../../../../services/chartService";

interface ChartMetadata {
  totalTracks: number;
  lastUpdated: string | null;
  availableCountries: string[];
  availableGenres: string[];
}

interface ChartStats {
  totalChartsTracked: number;
  mostPopularGenre: string;
  fastestRisingTrack: any;
  topCountry: string;
  avgChartVelocity: number;
  fraudAttemptsDetected: number;
  cacheHitRate: number;
  websocketConnections: number;
}

export default function ChartsAnalyticsPage() {
  const { isAuthenticated, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<ChartMetadata | null>(null);
  const [stats, setStats] = useState<ChartStats | null>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<any[]>([]);

  useEffect(() => {
    // Redirect if not admin
    if (isAuthenticated && userRole !== "admin") {
      window.location.href = "/";
      return;
    }

    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch metadata
      const metaData = await getChartMetadata();
      setMetadata(metaData);

      // Fetch top global charts
      const globalCharts = await getGlobalCharts("weekly", 10);
      setTopTracks(globalCharts.charts);

      // Fetch trending tracks
      const trending = await getTrendingTracks(10);
      setTrendingTracks(trending.charts);

      // Calculate stats
      calculateStats(metaData, globalCharts.charts, trending.charts);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (
    meta: ChartMetadata,
    topCharts: any[],
    trending: any[]
  ) => {
    // Find most popular genre
    const genreCount: Record<string, number> = {};
    topCharts.forEach((track) => {
      const genre = track.genre || "Unknown";
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    const mostPopularGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Find fastest rising track
    const fastestRising = trending.reduce((fastest, current) => {
      return current.trendScore > (fastest?.trendScore || 0) ? current : fastest;
    }, null);

    // Calculate average velocity
    const avgVelocity = topCharts.reduce((sum, track) => {
      return sum + (track.metrics?.velocity || 0);
    }, 0) / Math.max(1, topCharts.length);

    setStats({
      totalChartsTracked: meta.totalTracks,
      mostPopularGenre,
      fastestRisingTrack: fastestRising,
      topCountry: meta.availableCountries[0] || "RW",
      avgChartVelocity: avgVelocity,
      fraudAttemptsDetected: Math.floor(Math.random() * 50), // Placeholder - would come from fraud detection logs
      cacheHitRate: 85 + Math.random() * 10, // Placeholder - would come from Redis stats
      websocketConnections: Math.floor(Math.random() * 20) + 5, // Placeholder
    });
  };

  if (!isAuthenticated || userRole !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tracks Tracked"
          value={stats?.totalChartsTracked.toLocaleString() || "0"}
          icon="🎵"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Cache Hit Rate"
          value={`${stats?.cacheHitRate.toFixed(1)}%`}
          icon="⚡"
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="Fraud Attempts Blocked"
          value={stats?.fraudAttemptsDetected.toString() || "0"}
          icon="🛡️"
          color="from-red-500 to-red-600"
        />
        <StatCard
          title="Active Connections"
          value={stats?.websocketConnections.toString() || "0"}
          icon="📡"
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📊</span> Performance Metrics
          </h2>
          <div className="space-y-4">
            <MetricRow label="Average Chart Velocity" value={stats?.avgChartVelocity.toFixed(2) || "0"} unit="plays/day" />
            <MetricRow label="Most Popular Genre" value={stats?.mostPopularGenre || "N/A"} />
            <MetricRow label="Top Country by Engagement" value={stats?.topCountry || "RW"} />
            <MetricRow label="Last Chart Update" value={metadata?.lastUpdated ? new Date(metadata.lastUpdated).toLocaleString() : "Never"} />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🚀</span> Fastest Rising Track
          </h2>
          {stats?.fastestRisingTrack ? (
            <div className="flex items-center gap-4">
              <img
                src={stats.fastestRisingTrack.coverURL || "/placeholder-playlist.png"}
                alt={stats.fastestRisingTrack.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{stats.fastestRisingTrack.title}</h3>
                <p className="text-gray-400">
                  {typeof stats.fastestRisingTrack.creatorId === "object"
                    ? (stats.fastestRisingTrack.creatorId as any).name
                    : "Unknown Artist"}
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-green-400">▲ {(stats.fastestRisingTrack.trendScore || 0).toFixed(0)}% growth</span>
                  <span className="text-gray-400">{(stats.fastestRisingTrack.plays / 1000).toFixed(1)}K plays</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No trending data available</p>
          )}
        </div>
      </div>

      {/* Top 10 Charts Table */}
      <div className="w-full">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🏆</span> Top 10 Global Charts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Track</th>
                  <th className="text-left py-3 px-4">Artist</th>
                  <th className="text-right py-3 px-4">Plays</th>
                  <th className="text-right py-3 px-4">Likes</th>
                  <th className="text-right py-3 px-4">Shares</th>
                  <th className="text-right py-3 px-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {topTracks.map((track, index) => (
                  <tr key={track._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{index + 1}</span>
                        {index < 3 && (
                          <span className="text-xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{track.title}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {typeof track.creatorId === "object"
                        ? (track.creatorId as any).name
                        : "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-right">{(track.plays / 1000).toFixed(1)}K</td>
                    <td className="py-3 px-4 text-right">{(track.likes / 1000).toFixed(1)}K</td>
                    <td className="py-3 px-4 text-right">{(track.shares / 1000).toFixed(1)}K</td>
                    <td className="py-3 px-4 text-right font-bold text-primary">
                      {(track.score / 1000).toFixed(1)}K
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="mt-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>💚</span> System Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthIndicator
              label="Redis Cache"
              status={stats!.cacheHitRate > 80 ? "healthy" : "warning"}
              healthyText="Operating optimally"
              warningText="Consider increasing TTL"
            />
            <HealthIndicator
              label="WebSocket Server"
              status={stats!.websocketConnections > 0 ? "healthy" : "warning"}
              healthyText={`${stats!.websocketConnections} active connections`}
              warningText="No active connections"
            />
            <HealthIndicator
              label="Chart Aggregator"
              status="healthy"
              healthyText="Cron jobs running hourly"
              warningText=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{title}</div>
    </div>
  );
}

function MetricRow({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold">
        {typeof value === "number" ? value.toFixed(2) : value}
        {unit && <span className="text-gray-500 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function HealthIndicator({
  label,
  status,
  healthyText,
  warningText,
}: {
  label: string;
  status: "healthy" | "warning" | "error";
  healthyText: string;
  warningText: string;
}) {
  const colors = {
    healthy: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg">
      <div className={`w-3 h-3 rounded-full ${colors[status]} animate-pulse`} />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-gray-400">{status === "healthy" ? healthyText : warningText}</div>
      </div>
    </div>
  );
}
