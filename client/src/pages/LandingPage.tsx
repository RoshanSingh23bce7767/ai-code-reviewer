import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Code2, Bug, Shield, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const features = [
    { icon: Bug, title: 'Bug Detection', desc: 'AI spots bugs, logic errors, and anti-patterns before they reach production.', color: '#f59e0b' },
    { icon: Shield, title: 'Security Scanning', desc: 'Identify vulnerabilities, injection risks, and CVE-related patterns.', color: '#ef4444' },
    { icon: Sparkles, title: 'Optimized Code', desc: 'Get AI-refactored versions of your code with better practices applied.', color: '#6366f1' },
    { icon: Code2, title: 'Unit Tests', desc: 'Auto-generate comprehensive unit tests for your functions and classes.', color: '#22c55e' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Code Reviewer</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Sign in
          </Link>
          <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
          style={{ borderColor: '#6366f140', background: '#6366f110' }}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-400">Powered by Google Gemini AI</span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6"
          style={{ color: 'var(--text-primary)', letterSpacing: '-2px' }}>
          AI-powered{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)' }}>
            code reviews
          </span>
          <br />in seconds
        </h1>

        <p className="text-lg lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Find bugs, security vulnerabilities, and performance bottlenecks instantly. 
          Get optimized code, unit tests, and documentation — all from a single review.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-xl"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 0 40px #6366f140' }}>
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border hover:bg-white/5 transition-all"
            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-app)' }}>
            Sign in
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-1 mt-8">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Trusted by developers worldwide</span>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
          Everything you need to ship quality code
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-2xl border p-6 hover:scale-[1.02] transition-transform"
              style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto rounded-3xl p-12" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)' }}>
          <h2 className="text-3xl font-bold text-white mb-4">Ready to write better code?</h2>
          <p className="text-indigo-200 mb-8">Join thousands of developers improving their code quality with AI</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-indigo-900 font-bold bg-white hover:bg-indigo-50 transition-colors">
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 border-t" style={{ borderColor: 'var(--border-app)', color: 'var(--text-secondary)' }}>
        <p className="text-sm">© 2026 AI Code Reviewer · Built by Roshan Singh</p>
      </footer>
    </div>
  );
};

export default LandingPage;
