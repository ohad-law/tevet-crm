import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Users, Heart, Video, Eye, TrendingUp, ExternalLink, Music } from "lucide-react";
import { motion } from "framer-motion";
import { fetchTikTokStats } from "@/functions/fetchTikTokStats";

export default function TikTokStatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTikTokStats({});
      setStats(res.data);
      setExpanded(true);
    } catch (err) {
      setError(err?.response?.data?.error || "שגיאה בטעינת נתוני TikTok");
      setExpanded(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const statCards = stats?.profile ? [
    {
      label: "עוקבים",
      value: formatNumber(stats.profile.follower_count),
      icon: Users,
      color: "bg-rose-100 text-rose-600",
      bg: "from-rose-50 to-pink-50",
    },
    {
      label: "לייקים",
      value: formatNumber(stats.profile.likes_count),
      icon: Heart,
      color: "bg-red-100 text-red-600",
      bg: "from-red-50 to-orange-50",
    },
    {
      label: "סרטונים",
      value: formatNumber(stats.profile.video_count),
      icon: Video,
      color: "bg-blue-100 text-blue-600",
      bg: "from-blue-50 to-cyan-50",
    },
    {
      label: "עוקב אחרי",
      value: formatNumber(stats.profile.following_count),
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      bg: "from-purple-50 to-violet-50",
    },
  ] : [];

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
            <Music className="w-6 h-6 text-rose-400" />
            <span>TikTok Insights</span>
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadStats}
            disabled={loading}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            רענן
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && !stats && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">טוען נתוני TikTok...</p>
          </div>
        )}

        {error && !stats && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <Music className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-slate-600 font-medium">לא ניתן לטעון נתונים</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        )}

        {stats?.profile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-gray-100">
            {/* Profile Header */}
            <div className="p-6 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
              <Avatar className="w-14 h-14 ring-4 ring-white shadow-lg">
                <AvatarImage src={stats.profile.avatar_url} />
                <AvatarFallback className="bg-slate-800 text-white text-lg">
                  {stats.profile.display_name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 truncate">
                    @{stats.profile.display_name}
                  </h3>
                  {stats.profile.is_verified && (
                    <Badge className="bg-blue-500 text-white text-xs px-1.5">✓</Badge>
                  )}
                </div>
                {stats.profile.bio && (
                  <p className="text-sm text-slate-500 truncate mt-0.5">{stats.profile.bio}</p>
                )}
              </div>
              {stats.profile.profile_url && (
                <a
                  href={stats.profile.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 p-4 gap-3">
              {statCards.map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-gradient-to-br ${card.bg} rounded-xl p-3 text-center`}
                >
                  <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-slate-900 leading-tight">{card.value}</div>
                  <div className="text-[10px] text-slate-500">{card.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Videos */}
            {stats.videos?.length > 0 && (
              <div className="p-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900"
                >
                  <Eye className="w-4 h-4" />
                  סרטונים אחרונים ({stats.videos.length})
                  <span className="text-xs text-slate-400">{expanded ? "▲" : "▼"}</span>
                </button>

                {expanded && (
                  <div className="space-y-3">
                    {stats.videos.slice(0, 6).map((video, idx) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        {video.cover_url ? (
                          <img
                            src={video.cover_url}
                            alt=""
                            className="w-12 h-16 rounded-lg object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Video className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {video.title || "ללא כותרת"}
                          </p>
                          <div className="flex gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {formatNumber(video.views)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {formatNumber(video.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              💬 {formatNumber(video.comments)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}