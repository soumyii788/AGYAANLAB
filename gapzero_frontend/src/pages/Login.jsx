import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@gapzero.ai');
    setPassword('gapzero123');
    setError('');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#F8FAFC]">Sign In to GAPZERO</h2>
        <p className="text-xs text-slate-400 mt-1">
          Access your research projects and negative space intelligence.
        </p>
      </div>

      {/* Demo Credentials Helper Pill */}
      <div className="mb-5 p-3 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#38BDF8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Demo Account Ready
          </span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">admin@gapzero.ai / gapzero123</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={fillDemoCredentials}
          className="text-xs py-1 px-2.5"
        >
          Auto Fill
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="scientist@institute.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={loading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#1E293B] text-center">
        <p className="text-xs text-slate-400">
          New to GAPZERO?{' '}
          <Link to="/register" className="text-[#38BDF8] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
