import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed.');
      });
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-app)' }}>
      <div className="text-center max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Code Reviewer</span>
        </div>

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Verifying your email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Email verified!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your account is now active. You can log in now.</p>
            <Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              Continue to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Verification failed</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <Link to="/register" className="inline-block mt-4 px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              Register again
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
