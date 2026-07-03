import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../api/client';
import { TrendingUp, Bug, Shield, Clock, Code2, Loader2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, monthlyRes, langRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/monthly'),
          apiClient.get('/dashboard/languages'),
        ]);
        setStats(statsRes.data?.data);
        setMonthly(monthlyRes.data?.data || []);
        setLanguages(langRes.data?.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );

  const tooltipStyle = { contentStyle: { background: 'var(--surface-app)', border: '1px solid var(--border-app)', borderRadius: 8, color: 'var(--text-primary)' } };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your code review insights and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Code2, label: 'Total Reviews', value: stats?.totalReviews || 0, color: '#6366f1' },
          { icon: TrendingUp, label: 'Avg Score', value: `${stats?.averageScore || 0}%`, color: '#22c55e' },
          { icon: Bug, label: 'Bugs Found', value: stats?.bugsDetected || 0, color: '#f59e0b' },
          { icon: Shield, label: 'Security Issues', value: stats?.securityIssues || 0, color: '#ef4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl p-5 border" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Reviews */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Reviews</h2>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No data yet — run some reviews!</p>
            </div>
          )}
        </div>

        {/* Language Distribution */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Language Distribution</h2>
          {languages.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={languages} dataKey="count" nameKey="language" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                    {languages.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {languages.slice(0, 5).map((l: any, i: number) => (
                  <div key={l.language} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.language}</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No language data yet</p>
            </div>
          )}
        </div>

        {/* Average Scores Over Time */}
        <div className="rounded-2xl border p-5 lg:col-span-2" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Score Trend</h2>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="averageScore" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Score trend will appear after more reviews</p>
            </div>
          )}
        </div>
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <Clock className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats?.averageResponseTime ? `${(stats.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Review Time</p>
        </div>
        <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <Code2 className="w-6 h-6 mx-auto mb-2 text-violet-400" />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {(stats?.totalLinesReviewed || 0).toLocaleString()}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Lines Reviewed</p>
        </div>
        <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.favoriteLanguage || 'N/A'}</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Top Language</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
