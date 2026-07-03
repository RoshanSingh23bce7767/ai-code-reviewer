import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Trash2, LogOut, Loader2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
});
const deleteSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type DeleteForm = z.infer<typeof deleteSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateProfile, revokeSessions, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: profileErrors, isSubmitting: profileSaving } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const { register: regDelete, handleSubmit: submitDelete, formState: { isSubmitting: deleting } } = useForm<DeleteForm>({
    resolver: zodResolver(deleteSchema),
  });

  const onSaveProfile = async (data: ProfileForm) => {
    try {
      await updateProfile({ name: data.name });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const onRevokeSessions = async () => {
    if (!confirm('This will log you out of all devices. Continue?')) return;
    try {
      await revokeSessions();
      toast.success('All sessions revoked');
      navigate('/login');
    } catch {
      toast.error('Failed to revoke sessions');
    }
  };

  const onDelete = async (data: DeleteForm) => {
    try {
      await deleteAccount(data.password);
      toast.success('Account deleted');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your account settings</p>
      </div>

      {/* Avatar + Name */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ background: user?.role === 'admin' ? '#6366f120' : '#22c55e20', color: user?.role === 'admin' ? '#6366f1' : '#22c55e' }}>
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={submitProfile(onSaveProfile)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <input {...regProfile('name')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'var(--card-app)', borderColor: profileErrors.name ? '#ef4444' : 'var(--border-app)', color: 'var(--text-primary)' }} />
            </div>
            {profileErrors.name && <p className="mt-1 text-xs text-red-400">{profileErrors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email address</label>
            <input value={user?.email || ''} readOnly
              className="w-full px-4 py-3 rounded-xl border text-sm opacity-60 cursor-not-allowed"
              style={{ background: 'var(--card-app)', borderColor: 'var(--border-app)', color: 'var(--text-primary)' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Email cannot be changed</p>
          </div>
          <button type="submit" disabled={profileSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </form>
      </div>

      {/* Sessions */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--surface-app)', borderColor: 'var(--border-app)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Shield className="w-4 h-4 text-indigo-400" />
              Active Sessions
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign out of all devices and browsers</p>
          </div>
          <button onClick={onRevokeSessions}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-app)', color: 'var(--text-secondary)' }}>
            <LogOut className="w-4 h-4" />
            Revoke all
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface-app)', borderColor: '#ef444440' }}>
        <h2 className="font-semibold text-red-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Danger Zone
        </h2>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2.5 rounded-xl border text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            style={{ borderColor: '#ef444440' }}>
            Delete my account
          </button>
        ) : (
          <form onSubmit={submitDelete(onDelete)} className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This action is permanent and cannot be undone. Enter your password to confirm.
            </p>
            <input {...regDelete('password')} type="password" placeholder="Your password"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-red-500"
              style={{ background: 'var(--card-app)', borderColor: '#ef444440', color: 'var(--text-primary)' }} />
            <div className="flex gap-3">
              <button type="submit" disabled={deleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete permanently
              </button>
              <button type="button" onClick={() => setShowDelete(false)}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-white/5"
                style={{ borderColor: 'var(--border-app)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
