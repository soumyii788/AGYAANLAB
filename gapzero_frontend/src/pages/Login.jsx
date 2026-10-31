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
    setEmail('admin@agyaanlab.ai');
    setPassword('agyaanlab123');
    setError('');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#1E2022]">Sign In to AGYAAN LAB</h2>
        <p className="text-xs text-[#4A4D55] mt-1">
          Access your research projects and negative space intelligence.
        </p>
      </div>

      {/* Demo Credentials Helper Pill */}
      <div className="mb-5 p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-[#3B82F6] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Demo Account Ready
          </span>
          <p className="text-[11px] text-[#4A4D55] font-mono mt-0.5">admin@agyaanlab.ai / agyaanlab123</p>
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
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
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

      <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
        <p className="text-xs text-[#4A4D55]">
          New to AGYAAN LAB?{' '}
          <Link to="/register" className="text-[#3B82F6] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
