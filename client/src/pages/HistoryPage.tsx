import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { History, Star, Trash2, Search, ChevronLeft, ChevronRight, Code2, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { REVIEW_LANGUAGES } from '../constants/languages';

const LANGUAGES = ['All', ...REVIEW_LANGUAGES];

const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (search) params.q = search;
      if (language !== 'All') params.language = language;
      const res = await apiClient.get('/reviews', { params });
      const data = res.data?.data;
      setItems(data?.items || []);
      setTotal(data?.totalItems || 0);
      setTotalPages(data?.totalPages || 1);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [page, search, language]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const toggleFavorite = async (id: string) => {
    try {
      await apiClient.patch(`/reviews/${id}/favorite`);
      setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch { toast.error('Failed to update favorite'); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await apiClient.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      fetchHistory();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Review History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} total reviews</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reviews..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(l => (
            <button key={l} onClick={() => { setLanguage(l); setPage(1); }}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
              style={{
                background: language === l ? 'var(--primary)' : 'var(--surface-app)',
                borderColor: language === l ? 'var(--primary)' : 'var(--border-app)',
                color: language === l ? '#fff' : 'var(--text-secondary)'
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No reviews found</p>
            <Link to="/review" className="inline-block mt-3 text-sm text-indigo-400 hover:text-indigo-300">Start your first review →</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-app)' }}>
                    {['Title','Language','Date','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className="transition-colors hover:bg-white/3"
                      style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border-app)' : undefined }}>
                      <td className="px-4 py-3">
                        <Link to={`/review/${item.id}`} className="flex items-center gap-2 group">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <span className="text-sm font-medium group-hover:text-indigo-400 transition-colors truncate max-w-[200px]"
                            style={{ color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--card-app)', color: 'var(--text-secondary)' }}>
                          {item.language}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleFavorite(item.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`}
                              style={{ color: item.isFavorite ? '' : 'var(--text-secondary)' }} />
                          </button>
                          <button onClick={() => deleteReview(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-app)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border disabled:opacity-40 hover:bg-white/5"
                  style={{ borderColor: 'var(--border-app)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border disabled:opacity-40 hover:bg-white/5"
                  style={{ borderColor: 'var(--border-app)', color: 'var(--text-secondary)' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
