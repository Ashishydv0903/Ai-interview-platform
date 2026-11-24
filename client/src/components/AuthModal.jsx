import React, { useState } from 'react';
import { LogIn, UserPlus, X, Lock, Mail, User, GraduationCap, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password, role: 'candidate' } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        onLoginSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection error. Make sure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-[#1C476E] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#0F3154] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#5CDB94]/20 border border-[#5CDB94]/30 text-[#5CDB94] flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white font-['Outfit']">
            {isRegister ? 'Create Candidate Account' : 'Welcome Back, Candidate'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Sign in to save your resume, record all mock interviews, and track your skill improvement over time.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashish Yadav"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#071B2E] border border-[#1C476E] rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-[#5CDB94]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="candidate@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#071B2E] border border-[#1C476E] rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-[#5CDB94]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#071B2E] border border-[#1C476E] rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-[#5CDB94]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold rounded-xl shadow-lg shadow-[#5CDB94]/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            {isRegister ? <UserPlus className="w-4 h-4 text-[#0B2540]" /> : <LogIn className="w-4 h-4 text-[#0B2540]" />}
            {loading ? 'Processing...' : isRegister ? 'Register & Start Preparing' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#1C476E] text-center text-xs text-slate-300">
          {isRegister ? (
            <p>
              Already registered?{' '}
              <button onClick={() => setIsRegister(false)} className="text-[#5CDB94] font-semibold hover:underline">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New candidate?{' '}
              <button onClick={() => setIsRegister(true)} className="text-[#5CDB94] font-semibold hover:underline">
                Register Free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
