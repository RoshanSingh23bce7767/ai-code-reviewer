import React, { useEffect, useState } from 'react';
import { BarChart3, Code2, Bug, Shield, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';


const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }> = ({ icon: Icon, label, value, sub, color }) => (
  <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/reviews?limit=5'),
        ]);
        setStats(statsRes.data?.data);
        setHistory(historyRes.data?.data?.items || []);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const radarData = stats ? [
    { subject: 'Score', A: stats.averageScore },
    { subject: 'Bugs', A: Math.max(0, 100 - (stats.bugsDetected || 0) * 5) },
    { subject: 'Security', A: Math.max(0, 100 - (stats.securityIssues || 0) * 10) },
    { subject: 'Reviews', A: Math.min(100, (stats.totalReviews || 0) * 10) },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Here's your code review summary
          </p>
        </div>
        <Link to="/review"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
          <Code2 className="w-4 h-4" />
          New Review
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--surface-app)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Code2} label="Total Reviews" value={stats?.totalReviews || 0} color="#6366F1" />
            <StatCard icon={TrendingUp} label="Average Score" value={`${stats?.averageScore || 0}%`} sub="across all reviews" color="#22c55e" />
            <StatCard icon={Bug} label="Bugs Found" value={stats?.bugsDetected || 0} sub="across all reviews" color="#f59e0b" />
            <StatCard icon={Shield} label="Security Issues" value={stats?.securityIssues || 0} sub="detected" color="#ef4444" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Reviews */}
            <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Reviews</h2>
                <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Code2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No reviews yet</p>
                  <Link to="/review" className="inline-block mt-3 text-sm text-indigo-400 hover:text-indigo-300">Start your first review →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <Link key={item.id} to={`/review/${item.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Code2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.language} • {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      {item.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Radar / Summary */}
            <div className="rounded-2xl border p-5 flex flex-col" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Code Health</h2>
              {radarData.length > 0 ? (
                <div className="flex-1 min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border-app)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <Radar dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ background: 'var(--surface-app)', border: '1px solid var(--border-app)', borderRadius: 8, color: 'var(--text-primary)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Run reviews to see your code health</p>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Favourite language</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{stats?.favoriteLanguage || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Lines reviewed</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{(stats?.totalLinesReviewed || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Avg response time</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{stats?.averageResponseTime ? `${(stats.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
