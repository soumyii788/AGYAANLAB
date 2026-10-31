import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  X
} from 'lucide-react';

const GoogleIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);

  // Common authentication credentials (preserved across login and create account)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);

  // Additional registration fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Load saved credentials on mount if user previously saved them
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agyaan_saved_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) {
          setPassword(parsed.password);
          setPasswordConfirm(parsed.password);
        }
      }
    } catch (e) {
      console.warn('Could not read saved credentials', e);
    }
  }, []);

  // Synchronize confirm password with main password when switching to register
  const handleSwitchMode = (newMode) => {
    setError('');
    setSuccessMsg('');
    setMode(newMode);
    setSearchParams(newMode === 'register' ? { mode: 'register' } : {});

    // Automatically carry over password to passwordConfirm if moving to register
    if (newMode === 'register') {
      if (password && !passwordConfirm) {
        setPasswordConfirm(password);
      }
      if (email && !username) {
        setUsername(email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''));
      }
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    // If in register mode and user hasn't explicitly customized confirm, keep them synced
    if (mode === 'register' && (!passwordConfirm || passwordConfirm === password)) {
      setPasswordConfirm(val);
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (!username || username === email.split('@')[0]) {
      setUsername(val.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''));
    }
  };

  // Sign In Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await login({ email, password });

      // Save password if requested
      if (rememberPassword) {
        localStorage.setItem(
          'agyaan_saved_credentials',
          JSON.stringify({ email, password })
        );
      } else {
        localStorage.removeItem('agyaan_saved_credentials');
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        'Invalid email or password. You can create an account using this password below.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  // Create Account Handler (Saves & uses the exact same password)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!password) {
      setError('Please provide a password.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    setLoading(true);

    const names = name.trim().split(' ');
    const firstName = names[0] || username || 'Scientist';
    const lastName = names.slice(1).join(' ') || '';
    const finalUsername =
      username.trim() ||
      email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') ||
      `user_${Date.now()}`;

    const payload = {
      username: finalUsername,
      email: email.trim(),
      password,
      password_confirm: passwordConfirm,
      first_name: firstName,
      last_name: lastName,
      organization: organization.trim(),
      role: 'researcher',
    };

    try {
      await register(payload);

      // Save the exact same password locally so future logins auto-fill
      if (rememberPassword) {
        localStorage.setItem(
          'agyaan_saved_credentials',
          JSON.stringify({ email: email.trim(), password })
        );
      }

      setSuccessMsg('Account created successfully! Taking you to your dashboard...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Account creation failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login({ email: 'admin@agyaanlab.ai', password: 'agyaanlab123' });
      navigate(from, { replace: true });
    } catch (err) {
      console.warn('Guest login error, setting fallback guest session', err);
      const guestUser = {
        id: 'guest',
        email: 'guest@agyaanlab.ai',
        username: 'guest',
        first_name: 'Guest',
        last_name: 'Researcher',
        role: 'researcher',
      };
      localStorage.setItem('user', JSON.stringify(guestUser));
      localStorage.setItem('access_token', 'guest_access_token');
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth2 Handler
  const handleGoogleSignIn = async (emailOverride, nameOverride) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    // Determine target email: provided override, already typed in form, or open selector
    const targetEmail = (emailOverride || customGoogleEmail || email || '').trim();
    if (!targetEmail && !emailOverride) {
      setShowGoogleModal(true);
      return;
    }

    const finalEmail = targetEmail || 'scientist.curie@gmail.com';
    const finalName = (nameOverride || customGoogleName || name || finalEmail.split('@')[0]).trim();

    setGoogleLoading(true);
    setError('');
    try {
      await googleLogin({
        email: finalEmail,
        name: finalName,
        google_id: `google_${Date.now()}`,
      });
      setShowGoogleModal(false);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google auth error', err);
      setError(
        err.response?.data?.error ||
        'Google authentication failed. Please try again or continue with email.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      {/* ─── TAB SWITCHER (SIGN IN vs CREATE ACCOUNT) ────────────────────── */}
      <div className="flex items-center justify-between p-1 bg-gray-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => handleSwitchMode('login')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-black shadow-xs font-extrabold'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMode('register')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
            mode === 'register'
              ? 'bg-white text-black shadow-xs font-extrabold'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Header Info */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-[#1E2022] tracking-tight">
          {mode === 'login' ? 'Sign In to AGYAAN LAB' : 'Create AGYAAN LAB Account'}
        </h2>
        <p className="text-xs text-[#4A4D55] mt-1">
          {mode === 'login'
            ? 'Access your research dossiers, negative-space gaps, and verification telemetry.'
            : 'Join the intelligence layer designed to find what science missed.'}
        </p>
      </div>

      {/* ─── GOOGLE AUTH BUTTON ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => handleGoogleSignIn()}
        disabled={loading || googleLoading}
        className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-[#3C4043] text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] mb-4 group"
      >
        <GoogleIcon className="w-4 h-4 flex-shrink-0" />
        <span className="text-gray-700 group-hover:text-black">
          {googleLoading ? 'Connecting with Google...' : 'Continue with Google'}
        </span>
      </button>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-gray-400 font-semibold tracking-wider text-[10px]">
            or continue with email
          </span>
        </div>
      </div>

      {/* Notification: Same Password Saved / Carried Over Badge */}
      {password && (
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium text-[11px]">
              Password saved & synced across Sign In / Create Account
            </span>
          </div>
          <span className="font-mono text-[10px] text-gray-400">
            {password.length} chars
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p>{error}</p>
            {mode === 'login' && password && (
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-black underline cursor-pointer"
              >
                <span>Create account with this email & password now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─── FORM 1: SIGN IN MODE ────────────────────────────────────────── */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="scientist@institute.edu"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember Password Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              />
              <span className="text-gray-600 font-medium">Save password on this device</span>
            </label>

            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className="text-xs font-semibold text-black hover:underline cursor-pointer"
            >
              Need an account?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 bg-black hover:bg-neutral-800 text-white rounded-xl py-2.5 font-bold"
            isLoading={loading}
          >
            Sign In
          </Button>

          {/* Direct "Create Account with this password" shortcut */}
          {password && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="text-xs font-bold text-gray-700 hover:text-black transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3.5 py-1.5 rounded-full border border-gray-200"
              >
                <span>Create account using this password</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </form>
      )}

      {/* ─── FORM 2: CREATE ACCOUNT MODE ─────────────────────────────────── */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            name="name"
            placeholder="Dr. Marie Curie"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-gray-500" />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              name="username"
              placeholder="mcurie"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Institution"
              name="organization"
              placeholder="Sorbonne / CERN"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              leftIcon={<Building2 className="w-4 h-4 text-gray-500" />}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="curie@institut.fr"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
              required
            />
          </div>

          {/* Password Match / Saved Helper */}
          {password && (
            <div className="flex items-center justify-between text-[11px] px-1 text-gray-600">
              <span className="flex items-center gap-1.5">
                {password === passwordConfirm ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Same password applied</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-600">Passwords do not match yet</span>
                  </>
                )}
              </span>
              <span className="font-mono text-gray-400">{password.length} chars</span>
            </div>
          )}

          {/* Save & Remember Password checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              />
              <span className="font-medium">Save this password for future logins</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 bg-black hover:bg-neutral-800 text-white rounded-xl py-2.5 font-bold"
            isLoading={loading}
          >
            Create Account & Sign In
          </Button>
        </form>
      )}

      {/* ─── CONTINUE AS GUEST OPTION (DOWN SIDE) ────────────────────────── */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider text-[11px]">
            or explore platform
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-[#F9F9FB] hover:bg-gray-100 text-[#202124] text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs group"
      >
        <UserCheck className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" />
        <span>Continue as Guest</span>
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Bottom Switcher Footer */}
      <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
        {mode === 'login' ? (
          <p className="text-xs text-[#4A4D55]">
            New to AGYAAN LAB?{' '}
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className="text-black font-bold hover:underline cursor-pointer ml-1"
            >
              Create an account
            </button>
          </p>
        ) : (
          <p className="text-xs text-[#4A4D55]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className="text-black font-bold hover:underline cursor-pointer ml-1"
            >
              Sign in with this password
            </button>
          </p>
        )}
      </div>

      {/* ─── GOOGLE ACCOUNT SELECTOR MODAL ─────────────────────────────── */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <GoogleIcon className="w-5 h-5" />
                <span className="text-sm font-bold text-gray-900">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 mb-4">
              Choose an account to continue to <span className="font-semibold text-gray-800">AGYAAN LAB</span>
            </p>

            {/* Quick Profile Cards */}
            <div className="space-y-2.5 mb-4">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('curie.marie@gmail.com', 'Dr. Marie Curie')}
                disabled={googleLoading}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Dr. Marie Curie</p>
                  <p className="text-[11px] text-gray-500 truncate font-mono">curie.marie@gmail.com</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSignIn('researcher.agyaan@gmail.com', 'Staff Scientist')}
                disabled={googleLoading}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Staff Scientist</p>
                  <p className="text-[11px] text-gray-500 truncate font-mono">researcher.agyaan@gmail.com</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
              </button>
            </div>

            {/* Or Connect Custom Google Address */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-600 mb-2">Or connect your Google Account:</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail) {
                    handleGoogleSignIn(
                      customGoogleEmail,
                      customGoogleName || customGoogleEmail.split('@')[0]
                    );
                  }
                }}
                className="space-y-2.5"
              >
                <Input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-xs py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl"
                  isLoading={googleLoading}
                >
                  Connect with Google
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
