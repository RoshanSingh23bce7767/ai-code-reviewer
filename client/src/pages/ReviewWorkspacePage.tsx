import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Bug, Shield, Zap, Star, Code2, TestTube, BookOpen, BarChart2, ChevronDown } from 'lucide-react';
import apiClient from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import type { Review } from '../types';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { REVIEW_LANGUAGES, getLanguageMeta } from '../constants/languages';

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6366f1'
  };
  const c = colors[severity] || '#6366f1';
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${c}20`, color: c }}>{severity}</span>;
};

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const r = 38; const circ = 2 * Math.PI * r;
  const progress = ((100 - score) / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-app)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={progress} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>/ 100</span>
      </div>
    </div>
  );
};

const ReviewWorkspacePage: React.FC = () => {
  const { reviewId } = useParams();
  const { isDark } = useTheme();
  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState('// Paste your code here and click "Run Review"\n');
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [langOpen, setLangOpen] = useState(false);
  const languageMeta = getLanguageMeta(language);

  useEffect(() => {
    if (reviewId) {
      apiClient.get(`/reviews/${reviewId}`).then(r => setReview(r.data?.data)).catch(() => toast.error('Review not found'));
    }
  }, [reviewId]);

  const handleReview = async () => {
    if (!code.trim()) { toast.error('Please paste some code first'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post('/reviews', { language, sourceCode: code });
      const rid = res.data?.data?.reviewId;
      if (rid) {
        const detail = await apiClient.get(`/reviews/${rid}`);
        setReview(detail.data?.data);
        setActiveTab('summary');
        toast.success('Review generated!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Review failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart2 },
    { id: 'bugs', label: `Bugs ${review ? `(${review.bugs.length})` : ''}`, icon: Bug },
    { id: 'security', label: `Security ${review ? `(${review.securityIssues.length})` : ''}`, icon: Shield },
    { id: 'performance', label: `Performance ${review ? `(${review.performanceIssues.length})` : ''}`, icon: Zap },
    { id: 'optimized', label: 'Optimized Code', icon: Code2 },
    { id: 'tests', label: 'Unit Tests', icon: TestTube },
    { id: 'docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <div className="h-full flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Code Review Workspace</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Paste your code and get AI-powered insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
              style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)', color: 'var(--text-primary)' }}>
              <Star className="w-3.5 h-3.5 text-indigo-400" />
              {language}
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            </button>
            {langOpen && (
              <div className="absolute top-full mt-1 right-0 w-44 rounded-xl border shadow-xl z-10 overflow-y-auto max-h-60"
                style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
                {REVIEW_LANGUAGES.map(l => (
                  <button key={l} onClick={() => { setLanguage(l); setLangOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: l === language ? '#6366F1' : 'var(--text-primary)' }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleReview} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Reviewing...' : 'Run Review'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0">
        {/* Editor */}
        <div className="rounded-2xl border overflow-hidden flex flex-col min-h-[400px] xl:min-h-0"
          style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border-app)' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-medium ml-2" style={{ color: 'var(--text-secondary)' }}>
              {language.toLowerCase()}.{languageMeta.extension}
            </span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={languageMeta.monacoId}
              value={code}
              onChange={(v) => setCode(v || '')}
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                fontFamily: 'JetBrains Mono, Consolas, monospace',
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="rounded-2xl border flex flex-col min-h-[400px] xl:min-h-0"
          style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
          {!review && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto">
                  <Code2 className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Ready to review</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Paste your code and click "Run Review"</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analysing your code with AI...</p>
              </div>
            </div>
          )}
          {review && !loading && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'var(--border-app)' }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                    style={{
                      background: activeTab === id ? 'var(--primary)' : 'transparent',
                      color: activeTab === id ? '#fff' : 'var(--text-secondary)'
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <ScoreRing score={review.score} />
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Code Quality Score</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Review time: {(review.reviewTime / 1000).toFixed(1)}s
                        </p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-red-400">{review.bugs.length} bugs</span>
                          <span className="text-orange-400">{review.securityIssues.length} security</span>
                          <span className="text-yellow-400">{review.performanceIssues.length} perf</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'var(--card-app)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>AI Summary</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{review.aiSummary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ background: 'var(--card-app)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Time Complexity</p>
                        <p className="font-mono text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{review.complexity.time}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--card-app)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Space Complexity</p>
                        <p className="font-mono text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{review.complexity.space}</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'bugs' && (
                  <div className="space-y-3">
                    {review.bugs.length === 0 ? (
                      <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>🎉 No bugs detected!</p>
                    ) : review.bugs.map((bug, i) => (
                      <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--card-app)', borderColor: 'var(--border-app)' }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{bug.title}</p>
                          <SeverityBadge severity={bug.severity} />
                        </div>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Line {bug.line}</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{bug.description}</p>
                        <div className="rounded-lg p-3" style={{ background: 'var(--surface-app)' }}>
                          <p className="text-xs font-medium text-green-400 mb-1">Recommendation</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{bug.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'security' && (
                  <div className="space-y-3">
                    {review.securityIssues.length === 0 ? (
                      <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>✅ No security issues found!</p>
                    ) : review.securityIssues.map((issue, i) => (
                      <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--card-app)', borderColor: 'var(--border-app)' }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{issue.title}</p>
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        {issue.cve && <p className="text-xs text-indigo-400 mb-1">CVE: {issue.cve}</p>}
                        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{issue.description}</p>
                        <div className="rounded-lg p-3" style={{ background: 'var(--surface-app)' }}>
                          <p className="text-xs font-medium text-green-400 mb-1">Recommendation</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{issue.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'performance' && (
                  <div className="space-y-3">
                    {review.performanceIssues.length === 0 ? (
                      <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>⚡ No performance issues!</p>
                    ) : review.performanceIssues.map((issue, i) => (
                      <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--card-app)', borderColor: 'var(--border-app)' }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{issue.title}</p>
                        <p className="text-xs text-yellow-400 mb-2">Impact: {issue.impact}</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{issue.description}</p>
                        <div className="rounded-lg p-3" style={{ background: 'var(--surface-app)' }}>
                          <p className="text-xs font-medium text-green-400 mb-1">Recommendation</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{issue.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'optimized' && (
                  <div>
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-app)' }}>
                      <Editor
                        height="400px"
                        language={languageMeta.monacoId}
                        value={review.optimizedCode || '// No optimized code generated'}
                        theme={isDark ? 'vs-dark' : 'light'}
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, wordWrap: 'on', padding: { top: 12 } }}
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'tests' && (
                  <div>
                    <pre className="rounded-xl p-4 text-xs overflow-x-auto leading-relaxed" style={{ background: 'var(--card-app)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {review.unitTests || 'No unit tests generated.'}
                    </pre>
                  </div>
                )}
                {activeTab === 'docs' && (
                  <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--card-app)', color: 'var(--text-primary)' }}>
                    {review.documentation || 'No documentation generated.'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewWorkspacePage;
